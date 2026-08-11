import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import type {
  GameSettingsDoc,
  MerchantDoc,
  MerchantQuestion,
  MerchantQuestionsDoc,
  QuizBowlAttemptDoc,
  QuizBowlAttemptQuestion,
  QuizBowlAttemptSecretDoc,
  QuizBowlAttemptStatus,
  QuizBowlSeenQuestionsDoc,
  QuizBowlSettingsDoc,
  TindaCouponDoc,
} from '@tindadventure/shared'

const QUIZ_COOLDOWN_MS = 30 * 60 * 1000

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function generateCouponCode(): string {
  return `TC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

function questionKey(merchantId: string, question: string): string {
  return `${merchantId}:${question}`
}

interface RoundPick {
  merchantId: string
  merchantName: string
  merchantImageURL: string | null
  merchantTindaZone: string
  question: string
  options: string[]
  correctAnswer: string
}

// One random question per merchant with a questionnaire, preferring
// questions this player hasn't seen before — the server-side twin of the
// old client buildQuizRound, run here so the answer key never leaves
// this function. `merchants` only needs the public display fields.
function buildRoundPicks(
  merchants: Array<{ id: string; name: string; imageURL: string | null; tindaZone: string }>,
  questionsByMerchant: Map<string, MerchantQuestion[]>,
  seen: Set<string>,
): RoundPick[] {
  const picks: RoundPick[] = []
  for (const m of merchants) {
    const questions = questionsByMerchant.get(m.id) ?? []
    if (questions.length === 0) continue
    const unseen = questions.filter((q) => !seen.has(questionKey(m.id, q.question)))
    const pool = unseen.length > 0 ? unseen : questions
    const q = pool[Math.floor(Math.random() * pool.length)]
    picks.push({
      merchantId: m.id,
      merchantName: m.name,
      merchantImageURL: m.imageURL,
      merchantTindaZone: m.tindaZone,
      question: q.question,
      options: shuffle([q.correctAnswer, ...q.dummyAnswers]),
      correctAnswer: q.correctAnswer,
    })
  }
  return shuffle(picks)
}

interface AwardedCoupon {
  id: string
  merchantId: string
  code: string
}

// Tries each merchant with remaining supply, in random order, until one
// atomically claims a slot — same shape as awardVotingCoupon in
// voting.ts. The coupon doc id is deterministic (`${uid}_quizBowl`)
// instead of a random auto-id: that's what makes a second award attempt
// for the same player collide with the first instead of minting a
// second coupon, whether the retry comes from a double-tap, a dropped
// response, or this function's own idempotent replay path below.
async function awardQuizCoupon(
  db: FirebaseFirestore.Firestore,
  uid: string,
): Promise<AwardedCoupon | null> {
  const [settingsSnap, merchantsSnap] = await Promise.all([
    db.doc('config/gameSettings').get(),
    db.collection('merchants').get(),
  ])
  const settings = settingsSnap.data() as GameSettingsDoc | undefined
  const ticketsTotal = settings?.quizBowlTicketsTotal ?? 0
  if (ticketsTotal > 0 && (settings?.quizBowlTicketsIssued ?? 0) >= ticketsTotal) return null

  const candidates = shuffle(
    merchantsSnap.docs
      .map((d) => ({ id: d.id, ...(d.data() as MerchantDoc) }))
      .filter((m) => (m.couponsIssued ?? 0) < (m.couponSupply ?? 0)),
  )

  for (const merchant of candidates) {
    const coupon = await db.runTransaction(async (tx) => {
      const merchantRef = db.doc(`merchants/${merchant.id}`)
      const settingsRef = db.doc('config/gameSettings')
      const couponRef = db.doc(`tindaCoupons/${uid}_quizBowl`)
      const [merchantSnap, settingsSnap, couponSnap] = await Promise.all([
        tx.get(merchantRef),
        tx.get(settingsRef),
        tx.get(couponRef),
      ])

      if (couponSnap.exists) return null // already awarded to this player

      const merchantData = merchantSnap.data() as MerchantDoc | undefined
      if (!merchantData || (merchantData.couponsIssued ?? 0) >= (merchantData.couponSupply ?? 0)) {
        return null
      }

      const settingsData = settingsSnap.data() as GameSettingsDoc | undefined
      const cap = settingsData?.quizBowlTicketsTotal ?? 0
      const issued = settingsData?.quizBowlTicketsIssued ?? 0
      if (cap > 0 && issued >= cap) return null

      const couponDoc: TindaCouponDoc = {
        uid,
        merchantId: merchant.id,
        code: generateCouponCode(),
        source: 'quizBowl',
        awardedAt: Date.now(),
        redeemed: false,
        redeemedAt: null,
        redeemedCode: null,
      }
      tx.update(merchantRef, { couponsIssued: (merchantData.couponsIssued ?? 0) + 1 })
      if (settingsSnap.exists) tx.update(settingsRef, { quizBowlTicketsIssued: issued + 1 })
      tx.set(couponRef, couponDoc)
      return { id: couponRef.id, merchantId: merchant.id, code: couponDoc.code }
    })
    if (coupon) return coupon
  }
  return null
}

// Cheap existence check before trying to award — covers both the normal
// "just won, hand out a coupon" path and the recovery path for a player
// whose attempt already reads 'won' but who, for whatever reason (a
// crashed function invocation, a replayed call), never actually got one.
async function ensureQuizCoupon(
  db: FirebaseFirestore.Firestore,
  uid: string,
): Promise<AwardedCoupon | null> {
  const existing = await db.doc(`tindaCoupons/${uid}_quizBowl`).get()
  if (existing.exists) {
    const data = existing.data() as TindaCouponDoc
    return { id: existing.id, merchantId: data.merchantId, code: data.code }
  }
  return awardQuizCoupon(db, uid)
}

// Best-effort: grading has already committed by the time this runs, so a
// failure here must never surface as an error to the client — the player
// really did win either way. Worst case they see "no coupon right now"
// and an admin can spot + fix it later (their attempt reads 'won' with
// no matching tindaCoupons/{uid}_quizBowl doc).
async function tryAwardOrEnsure(
  db: FirebaseFirestore.Firestore,
  uid: string,
  mode: 'award' | 'ensure',
): Promise<AwardedCoupon | null> {
  try {
    return mode === 'award' ? await awardQuizCoupon(db, uid) : await ensureQuizCoupon(db, uid)
  } catch (error) {
    console.error('Quiz Bowl coupon award failed for', uid, error)
    return null
  }
}

// Starts a brand-new round for the caller. Builds the round server-side
// and stores the answer key in quizBowlAttemptSecrets/{uid} — a
// collection no client rule ever grants access to — so the round doc
// the player's browser actually reads never carries a correctAnswer
// field for a question they haven't answered yet.
export const startQuizAttempt = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in to play Quiz Bowl.')

  const db = getFirestore()
  const attemptRef = db.doc(`quizBowlAttempts/${uid}`)
  const secretRef = db.doc(`quizBowlAttemptSecrets/${uid}`)
  const seenRef = db.doc(`quizBowlSeenQuestions/${uid}`)

  const [settingsSnap, attemptSnap] = await Promise.all([
    db.doc('config/gameSettings').get(),
    attemptRef.get(),
  ])
  const settings = settingsSnap.data() as GameSettingsDoc | undefined
  if (settings?.quizBowlOpen === false) {
    throw new HttpsError('failed-precondition', 'Quiz Bowl is currently closed.')
  }

  const existing = attemptSnap.data() as QuizBowlAttemptDoc | undefined
  if (existing?.status === 'won') {
    throw new HttpsError('failed-precondition', 'You already won Quiz Bowl.')
  }
  if (existing?.status === 'in_progress') {
    throw new HttpsError('failed-precondition', 'You already have a round in progress.')
  }
  if (existing?.status === 'lost' && existing.cooldownUntil && existing.cooldownUntil > Date.now()) {
    throw new HttpsError('failed-precondition', 'You are still on cooldown.')
  }

  const [merchantsSnap, quizSettingsSnap, seenSnap] = await Promise.all([
    db.collection('merchants').get(),
    db.doc('config/quizBowlSettings').get(),
    seenRef.get(),
  ])

  const eligibleMerchants = merchantsSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() as MerchantDoc) }))
    .filter((m) => (m.questionCount ?? 0) > 0)

  if (eligibleMerchants.length === 0) {
    throw new HttpsError('failed-precondition', 'No quiz questions available yet.')
  }

  const questionsSnaps = await Promise.all(
    eligibleMerchants.map((m) => db.doc(`merchantQuestions/${m.id}`).get()),
  )
  const questionsByMerchant = new Map<string, MerchantQuestion[]>()
  questionsSnaps.forEach((snap, i) => {
    const data = snap.data() as MerchantQuestionsDoc | undefined
    questionsByMerchant.set(eligibleMerchants[i].id, data?.questions ?? [])
  })

  const noRepeat =
    (quizSettingsSnap.data() as QuizBowlSettingsDoc | undefined)?.noRepeatQuestions ?? false
  const seen = new Set(
    noRepeat ? ((seenSnap.data() as QuizBowlSeenQuestionsDoc | undefined)?.seen ?? []) : [],
  )

  const picks = buildRoundPicks(eligibleMerchants, questionsByMerchant, seen)
  if (picks.length === 0) {
    throw new HttpsError('failed-precondition', 'No quiz questions available yet.')
  }

  const round: QuizBowlAttemptQuestion[] = picks.map((p) => ({
    merchantId: p.merchantId,
    merchantName: p.merchantName,
    merchantImageURL: p.merchantImageURL,
    merchantTindaZone: p.merchantTindaZone,
    question: p.question,
    options: p.options,
  }))
  const answers = picks.map((p) => p.correctAnswer)
  const seenKeys = picks.map((p) => questionKey(p.merchantId, p.question))

  const now = Date.now()
  const attempt: QuizBowlAttemptDoc = {
    uid,
    status: 'in_progress',
    round,
    index: 0,
    correctCount: 0,
    startedAt: now,
    finishedAt: null,
    cooldownUntil: null,
  }
  const secret: QuizBowlAttemptSecretDoc = { uid, answers }

  const writes: Promise<unknown>[] = [attemptRef.set(attempt), secretRef.set(secret)]
  if (seenKeys.length > 0) {
    writes.push(seenRef.set({ uid, seen: FieldValue.arrayUnion(...seenKeys) }, { merge: true }))
  }
  await Promise.all(writes)

  return { round }
})

interface GradedResult {
  finished: boolean
  correct?: boolean
  correctAnswer?: string
  isLast: boolean
  correctCount: number
  status: QuizBowlAttemptStatus
  cooldownUntil: number | null
}

// Grades exactly one answer for the caller's current question, server
// side, against the answer key in quizBowlAttemptSecrets/{uid} — the
// client never sees correctAnswer until after it has committed the
// player's choice for that question. The read-modify-write of the
// attempt doc happens inside one transaction, so a double-fired call
// (double-tap, retry, a second browser tab) either loses the race and
// gets short-circuited below, or — if it arrives after the first commit
// — reads a status that's no longer 'in_progress' and takes the replay
// path instead of re-grading.
export const submitQuizAnswer = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in to play Quiz Bowl.')

  const selectedOption = request.data?.selectedOption
  if (typeof selectedOption !== 'string' || selectedOption.length === 0) {
    throw new HttpsError('invalid-argument', 'selectedOption is required.')
  }

  const db = getFirestore()
  const attemptRef = db.doc(`quizBowlAttempts/${uid}`)
  const secretRef = db.doc(`quizBowlAttemptSecrets/${uid}`)
  const usersRef = db.doc(`users/${uid}`)

  const graded = await db.runTransaction(async (tx): Promise<GradedResult> => {
    const [attemptSnap, secretSnap] = await Promise.all([tx.get(attemptRef), tx.get(secretRef)])
    const attempt = attemptSnap.data() as QuizBowlAttemptDoc | undefined
    if (!attempt) throw new HttpsError('failed-precondition', 'No active Quiz Bowl round.')

    if (attempt.status !== 'in_progress') {
      return {
        finished: true,
        isLast: true,
        correctCount: attempt.correctCount,
        status: attempt.status,
        cooldownUntil: attempt.cooldownUntil,
      }
    }

    const secret = secretSnap.data() as QuizBowlAttemptSecretDoc | undefined
    const correctAnswer = secret?.answers?.[attempt.index]
    if (correctAnswer === undefined) {
      throw new HttpsError('internal', 'Quiz answer key is missing for this question.')
    }

    const correct = selectedOption === correctAnswer
    const newCorrectCount = attempt.correctCount + (correct ? 1 : 0)
    const newIndex = attempt.index + 1
    const isLast = newIndex >= attempt.round.length
    const now = Date.now()

    if (!isLast) {
      tx.update(attemptRef, { index: newIndex, correctCount: newCorrectCount })
      return {
        finished: false,
        correct,
        correctAnswer,
        isLast: false,
        correctCount: newCorrectCount,
        status: 'in_progress',
        cooldownUntil: null,
      }
    }

    const winThreshold = Math.ceil(attempt.round.length / 2)
    const won = newCorrectCount >= winThreshold

    if (!won) {
      const cooldownUntil = now + QUIZ_COOLDOWN_MS
      tx.update(attemptRef, {
        index: newIndex,
        correctCount: newCorrectCount,
        status: 'lost',
        finishedAt: now,
        cooldownUntil,
      })
      return {
        finished: false,
        correct,
        correctAnswer,
        isLast: true,
        correctCount: newCorrectCount,
        status: 'lost',
        cooldownUntil,
      }
    }

    tx.update(attemptRef, {
      index: newIndex,
      correctCount: newCorrectCount,
      status: 'won',
      finishedAt: now,
      cooldownUntil: null,
    })
    tx.update(usersRef, { quizBowl: { hasWon: true, wonAt: now } })

    return {
      finished: false,
      correct,
      correctAnswer,
      isLast: true,
      correctCount: newCorrectCount,
      status: 'won',
      cooldownUntil: null,
    }
  })

  if (graded.status !== 'won') {
    return { ...graded, coupon: null, soldOut: false }
  }

  const coupon = await tryAwardOrEnsure(db, uid, graded.finished ? 'ensure' : 'award')
  return { ...graded, coupon, soldOut: coupon === null }
})
