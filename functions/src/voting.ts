import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { logger } from 'firebase-functions'
import type { GameSettingsDoc, MerchantDoc, TindaCouponDoc, VoteDoc } from '@tindadventure/shared'

// A voting round is short and live (e.g. a 10-minute "People's Choice"
// segment), so the gap before the next drop scales to whatever's actually
// left in the round instead of a fixed number — a 10-minute round and a
// 2-hour round both get drops spread proportionally across them. Floored
// at one scheduler tick (drops can't land faster than this function is
// even checked) and capped at half of what's left, so there's always
// runway for at least one more drop before the round ends.
const CHECK_INTERVAL_MS = 60 * 1000

function randomDropGapMs(remainingMs: number): number {
  const min = Math.min(CHECK_INTERVAL_MS, remainingMs)
  const max = Math.max(min, remainingMs * 0.5)
  return min + Math.random() * (max - min)
}

function generateCouponCode(): string {
  return `TC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// Increment a performer's public vote tally server-side, on vote
// creation — never trusted to the client, so the count can't be gamed by
// a client-side increment rule.
export const onVoteCreated = onDocumentCreated('votes/{voteId}', async (event) => {
  const snap = event.data
  if (!snap) return
  const vote = snap.data() as VoteDoc
  await getFirestore()
    .doc(`votingPerformers/${vote.performerId}`)
    .update({ voteCount: FieldValue.increment(1) })
})

// Atomically checks whether a round is live and a drop is due, and if so,
// claims this cycle by immediately scheduling the next random drop time —
// so an overlapping or retried invocation always backs off instead of
// double-dropping.
async function claimDropSlot(
  db: FirebaseFirestore.Firestore,
): Promise<{ claimed: boolean; settings: GameSettingsDoc | null }> {
  const settingsRef = db.doc('config/gameSettings')
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(settingsRef)
    const settings = (snap.data() as GameSettingsDoc | undefined) ?? null
    const now = Date.now()

    const windowEndsAt = settings?.votingWindowEndsAt
    if (windowEndsAt == null || now >= windowEndsAt) return { claimed: false, settings }

    const total = settings?.votingTicketsTotal ?? 0
    const issued = settings?.votingTicketsIssued ?? 0
    if (total > 0 && issued >= total) return { claimed: false, settings }

    const nextDropAt = settings?.nextVotingDropAt
    if (nextDropAt == null) {
      // First tick since this round started — seed a random first-drop
      // time instead of dropping right away, so even the very first drop
      // is randomized across the whole window, not anchored to the start.
      tx.update(settingsRef, { nextVotingDropAt: now + randomDropGapMs(windowEndsAt - now) })
      return { claimed: false, settings }
    }
    if (now < nextDropAt) return { claimed: false, settings }

    tx.update(settingsRef, { nextVotingDropAt: now + randomDropGapMs(windowEndsAt - now) })
    return { claimed: true, settings }
  })
}

async function pickEligibleVoter(db: FirebaseFirestore.Firestore): Promise<string | null> {
  const [votesSnap, priorWinnersSnap] = await Promise.all([
    db.collection('votes').select('uid').get(),
    db.collection('tindaCoupons').where('source', '==', 'voting').select('uid').get(),
  ])
  const voterUids = [...new Set(votesSnap.docs.map((d) => d.data().uid as string))]
  const excluded = new Set(priorWinnersSnap.docs.map((d) => d.data().uid as string))
  const eligible = shuffle(voterUids.filter((uid) => !excluded.has(uid)))
  return eligible[0] ?? null
}

// Same shape as the client's quizBowl/tasked award transaction (try
// merchants with remaining supply, in random order, until one atomically
// claims a slot) — just run with the Admin SDK instead of on a player's
// own client, since nobody's session is driving this award.
async function awardVotingCoupon(db: FirebaseFirestore.Firestore, uid: string): Promise<boolean> {
  const merchantsSnap = await db.collection('merchants').get()
  const candidates = shuffle(
    merchantsSnap.docs
      .map((d) => ({ id: d.id, ...(d.data() as MerchantDoc) }))
      .filter((m) => (m.couponsIssued ?? 0) < (m.couponSupply ?? 0)),
  )

  for (const merchant of candidates) {
    const awarded = await db.runTransaction(async (tx) => {
      const merchantRef = db.doc(`merchants/${merchant.id}`)
      const settingsRef = db.doc('config/gameSettings')
      const [merchantSnap, settingsSnap] = await Promise.all([tx.get(merchantRef), tx.get(settingsRef)])

      const merchantData = merchantSnap.data() as MerchantDoc | undefined
      if (!merchantData || (merchantData.couponsIssued ?? 0) >= (merchantData.couponSupply ?? 0)) {
        return false
      }

      const settingsData = settingsSnap.data() as GameSettingsDoc | undefined
      const total = settingsData?.votingTicketsTotal ?? 0
      const issued = settingsData?.votingTicketsIssued ?? 0
      if (total > 0 && issued >= total) return false

      const couponRef = db.collection('tindaCoupons').doc()
      const coupon: TindaCouponDoc = {
        uid,
        merchantId: merchant.id,
        code: generateCouponCode(),
        source: 'voting',
        awardedAt: Date.now(),
        redeemed: false,
        redeemedAt: null,
        redeemedCode: null,
      }
      tx.update(merchantRef, { couponsIssued: (merchantData.couponsIssued ?? 0) + 1 })
      if (settingsSnap.exists) tx.update(settingsRef, { votingTicketsIssued: issued + 1 })
      tx.set(couponRef, coupon)
      return true
    })
    if (awarded) return true
  }
  return false
}

export const dropVotingTickets = onSchedule({ schedule: 'every 1 minutes', timeZone: 'Asia/Manila' }, async () => {
  const db = getFirestore()

  const { claimed } = await claimDropSlot(db)
  if (!claimed) return

  const winnerUid = await pickEligibleVoter(db)
  if (!winnerUid) {
    logger.info('Voting drop due, but no eligible voter to award.')
    return
  }

  const awarded = await awardVotingCoupon(db, winnerUid)
  if (!awarded) {
    logger.info('Voting drop due, but no merchant had remaining TindaCoupon supply.')
    return
  }

  logger.info(`Voting TindaCoupon dropped for ${winnerUid}.`)
})
