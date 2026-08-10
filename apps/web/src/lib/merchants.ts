import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import type { MerchantDoc, MerchantQuestion } from '@tindadventure/shared'
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

export async function addMerchant(input: {
  name: string
  description: string
  product: string
  tindaZone: string
  youthRepresentative: string
  imageURL: string | null
  questions: MerchantQuestion[]
}) {
  if (!db) return

  const merchant: MerchantDoc = {
    name: input.name.trim(),
    description: input.description.trim(),
    product: input.product.trim(),
    tindaZone: input.tindaZone.trim(),
    youthRepresentative: input.youthRepresentative.trim(),
    imageURL: input.imageURL,
    questions: cleanQuestions(input.questions),
  }
  await addDoc(collection(db, 'merchants'), merchant)
}

export async function updateMerchant(
  id: string,
  input: {
    name: string
    description: string
    product: string
    tindaZone: string
    youthRepresentative: string
    imageURL: string | null
    questions: MerchantQuestion[]
  },
) {
  if (!db) return

  const merchant: MerchantDoc = {
    name: input.name.trim(),
    description: input.description.trim(),
    product: input.product.trim(),
    tindaZone: input.tindaZone.trim(),
    youthRepresentative: input.youthRepresentative.trim(),
    imageURL: input.imageURL,
    questions: cleanQuestions(input.questions),
  }
  await setDoc(doc(db, 'merchants', id), merchant)
}

export async function deleteMerchant(id: string) {
  if (!db) return
  await deleteDoc(doc(db, 'merchants', id))
}
