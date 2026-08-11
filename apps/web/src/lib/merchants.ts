import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import type {
  MerchantCodeDoc,
  MerchantDoc,
  MerchantQuestion,
  MerchantQuestionsDoc,
} from '@tindadventure/shared'
import { db, storage } from './firebase'
import { compressImage } from './image'

export interface MerchantWithId extends MerchantDoc {
  id: string
}

export function subscribeToMerchants(onChange: (merchants: MerchantWithId[]) => void) {
  if (!db) return () => {}

  const q = query(collection(db, 'merchants'), orderBy('name'))
  return onSnapshot(
    q,
    (snapshot) => {
      onChange(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as MerchantDoc) })))
    },
    (error) => {
      console.error('Failed to subscribe to merchants:', error)
      onChange([])
    },
  )
}

// Admin-only: {merchantId: code}. Never exposed to players — the
// merchants collection itself stays public but never carries this field.
export function subscribeToMerchantCodes(onChange: (codes: Record<string, string>) => void) {
  if (!db) return () => {}
  return onSnapshot(
    collection(db, 'merchantCodes'),
    (snapshot) => {
      const codes: Record<string, string> = {}
      snapshot.docs.forEach((d) => {
        codes[d.id] = (d.data() as MerchantCodeDoc).code
      })
      onChange(codes)
    },
    (error) => {
      console.error('Failed to subscribe to merchant codes:', error)
      onChange({})
    },
  )
}

// Admin-only: {merchantId: questions[]} — the real questionnaire,
// including correctAnswer. Never exposed to players; the public
// merchants collection only ever carries a questionCount. Used by the
// admin Merchants tab to populate the edit form.
export function subscribeToMerchantQuestions(
  onChange: (questionsByMerchant: Record<string, MerchantQuestion[]>) => void,
) {
  if (!db) return () => {}
  return onSnapshot(
    collection(db, 'merchantQuestions'),
    (snapshot) => {
      const byMerchant: Record<string, MerchantQuestion[]> = {}
      snapshot.docs.forEach((d) => {
        byMerchant[d.id] = (d.data() as MerchantQuestionsDoc).questions
      })
      onChange(byMerchant)
    },
    (error) => {
      console.error('Failed to subscribe to merchant questions:', error)
      onChange({})
    },
  )
}

export async function uploadMerchantImage(file: File): Promise<string> {
  if (!storage) throw new Error('Storage is not configured')

  const compressed = await compressImage(file)
  const path = `merchants/${Date.now()}-${compressed.name}`
  const fileRef = ref(storage, path)
  await uploadBytes(fileRef, compressed)
  return getDownloadURL(fileRef)
}

function cleanQuestions(questions: MerchantQuestion[]): MerchantQuestion[] {
  return questions
    .map((q) => ({
      question: q.question.trim(),
      correctAnswer: q.correctAnswer.trim(),
      dummyAnswers: q.dummyAnswers.map((a) => a.trim()),
    }))
    .filter((q) => q.question && q.correctAnswer && q.dummyAnswers.every(Boolean))
    .slice(0, 5)
}

interface MerchantInput {
  name: string
  description: string
  product: string
  tindaZone: string
  youthRepresentative: string
  imageURL: string | null
  questions: MerchantQuestion[]
  couponSupply: number
  merchantCode: string
}

export async function addMerchant(input: MerchantInput) {
  if (!db) return

  const questions = cleanQuestions(input.questions)
  const merchant: MerchantDoc = {
    name: input.name.trim(),
    description: input.description.trim(),
    product: input.product.trim(),
    tindaZone: input.tindaZone.trim(),
    youthRepresentative: input.youthRepresentative.trim(),
    imageURL: input.imageURL,
    questionCount: questions.length,
    couponSupply: Math.max(0, Math.floor(input.couponSupply) || 0),
    couponsIssued: 0,
  }
  const ref = await addDoc(collection(db, 'merchants'), merchant)
  await Promise.all([
    setDoc(doc(db, 'merchantCodes', ref.id), { code: input.merchantCode.trim() }),
    setDoc(doc(db, 'merchantQuestions', ref.id), { questions }),
  ])
}

export async function updateMerchant(id: string, input: MerchantInput) {
  if (!db) return
  const ref = doc(db, 'merchants', id)

  // couponsIssued only ever changes via the coupon-award transaction,
  // never a manual edit — but it's re-included here (read fresh, not
  // reset) so merchants created before this field existed still end up
  // with a real number instead of staying permanently unset, which would
  // otherwise make the award transaction's rules check fail forever.
  const existing = (await getDoc(ref)).data() as MerchantDoc | undefined
  const questions = cleanQuestions(input.questions)
  const merchant: MerchantDoc = {
    name: input.name.trim(),
    description: input.description.trim(),
    product: input.product.trim(),
    tindaZone: input.tindaZone.trim(),
    youthRepresentative: input.youthRepresentative.trim(),
    imageURL: input.imageURL,
    questionCount: questions.length,
    couponSupply: Math.max(0, Math.floor(input.couponSupply) || 0),
    couponsIssued: existing?.couponsIssued ?? 0,
  }
  await Promise.all([
    setDoc(ref, merchant, { merge: true }),
    setDoc(doc(db, 'merchantCodes', id), { code: input.merchantCode.trim() }),
    setDoc(doc(db, 'merchantQuestions', id), { questions }),
  ])
}

// One-time backfill for merchants created before the merchantQuestions
// split: their real questionnaire is still sitting in a now-unused
// `questions` field on the merchant doc itself (dead weight, but never
// deleted by the schema change — old fields survive a merge write).
// This copies it into merchantQuestions/{id} and backfills questionCount,
// so existing quiz data isn't silently orphaned by the new schema. Safe
// to click more than once — a merchant that already has a
// merchantQuestions doc is left untouched.
export async function migrateLegacyMerchantQuestions(): Promise<{ migrated: number; skipped: number }> {
  if (!db) return { migrated: 0, skipped: 0 }
  const firestore = db

  const [merchantsSnap, questionsSnap] = await Promise.all([
    getDocs(collection(firestore, 'merchants')),
    getDocs(collection(firestore, 'merchantQuestions')),
  ])
  const alreadyMigrated = new Set(questionsSnap.docs.map((d) => d.id))

  let migrated = 0
  let skipped = 0
  for (const merchantDoc of merchantsSnap.docs) {
    if (alreadyMigrated.has(merchantDoc.id)) {
      skipped++
      continue
    }
    const raw = merchantDoc.data() as { questions?: MerchantQuestion[] }
    const legacyQuestions = cleanQuestions(raw.questions ?? [])
    if (legacyQuestions.length === 0) {
      skipped++
      continue
    }
    await Promise.all([
      setDoc(doc(firestore, 'merchantQuestions', merchantDoc.id), { questions: legacyQuestions }),
      setDoc(
        doc(firestore, 'merchants', merchantDoc.id),
        { questionCount: legacyQuestions.length },
        { merge: true },
      ),
    ])
    migrated++
  }
  return { migrated, skipped }
}

export async function deleteMerchant(id: string) {
  if (!db) return
  await Promise.all([
    deleteDoc(doc(db, 'merchants', id)),
    deleteDoc(doc(db, 'merchantCodes', id)),
    deleteDoc(doc(db, 'merchantQuestions', id)),
  ])
}
