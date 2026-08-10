import { arrayUnion, doc, getDoc, setDoc } from 'firebase/firestore'
import type { QuizBowlSeenQuestionsDoc } from '@tindadventure/shared'
import { db } from './firebase'

export async function getSeenQuestions(uid: string): Promise<Set<string>> {
  if (!db) return new Set()
  const snapshot = await getDoc(doc(db, 'quizBowlSeenQuestions', uid))
  const data = snapshot.exists() ? (snapshot.data() as QuizBowlSeenQuestionsDoc) : null
  return new Set(data?.seen ?? [])
}

export async function recordSeenQuestions(uid: string, keys: string[]) {
  if (!db || keys.length === 0) return
  await setDoc(doc(db, 'quizBowlSeenQuestions', uid), { uid, seen: arrayUnion(...keys) }, { merge: true })
}
