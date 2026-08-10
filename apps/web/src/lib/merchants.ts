import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import type { MerchantCodeDoc, MerchantDoc, MerchantQuestion } from '@tindadventure/shared'
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

  const merchant: MerchantDoc = {
    name: input.name.trim(),
    description: input.description.trim(),
    product: input.product.trim(),
    tindaZone: input.tindaZone.trim(),
    youthRepresentative: input.youthRepresentative.trim(),
    imageURL: input.imageURL,
    questions: cleanQuestions(input.questions),
    couponSupply: Math.max(0, Math.floor(input.couponSupply) || 0),
    couponsIssued: 0,
  }
  const ref = await addDoc(collection(db, 'merchants'), merchant)
  await setDoc(doc(db, 'merchantCodes', ref.id), { code: input.merchantCode.trim() })
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
  const merchant: MerchantDoc = {
    name: input.name.trim(),
    description: input.description.trim(),
    product: input.product.trim(),
    tindaZone: input.tindaZone.trim(),
    youthRepresentative: input.youthRepresentative.trim(),
    imageURL: input.imageURL,
    questions: cleanQuestions(input.questions),
    couponSupply: Math.max(0, Math.floor(input.couponSupply) || 0),
    couponsIssued: existing?.couponsIssued ?? 0,
  }
  await setDoc(ref, merchant, { merge: true })
  await setDoc(doc(db, 'merchantCodes', id), { code: input.merchantCode.trim() })
}

export async function deleteMerchant(id: string) {
  if (!db) return
  await deleteDoc(doc(db, 'merchants', id))
  await deleteDoc(doc(db, 'merchantCodes', id))
}
