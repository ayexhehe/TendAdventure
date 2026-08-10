import { doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import type { QuizBowlAttemptDoc, QuizBowlAttemptQuestion, QuizBowlAttemptStatus } from '@tindadventure/shared'
import { db } from './firebase'

export const QUIZ_COOLDOWN_MS = 30 * 60 * 1000

export async function getAttempt(uid: string): Promise<QuizBowlAttemptDoc | null> {
  if (!db) return null
  const snapshot = await getDoc(doc(db, 'quizBowlAttempts', uid))
  return snapshot.exists() ? (snapshot.data() as QuizBowlAttemptDoc) : null
}

export function subscribeToAttempt(uid: string, onChange: (attempt: QuizBowlAttemptDoc | null) => void) {
  if (!db) return () => {}
  return onSnapshot(
    doc(db, 'quizBowlAttempts', uid),
    (snapshot) => onChange(snapshot.exists() ? (snapshot.data() as QuizBowlAttemptDoc) : null),
    (error) => {
      console.error('Failed to subscribe to quiz bowl attempt:', error)
      onChange(null)
    },
  )
}

export async function startAttempt(
  uid: string,
  round: QuizBowlAttemptQuestion[],
): Promise<QuizBowlAttemptDoc> {
  const attempt: QuizBowlAttemptDoc = {
    uid,
    status: 'in_progress',
    round,
    index: 0,
    correctCount: 0,
    startedAt: Date.now(),
    finishedAt: null,
    cooldownUntil: null,
  }
  if (db) await setDoc(doc(db, 'quizBowlAttempts', uid), attempt)
  return attempt
}

export async function advanceAttempt(
  uid: string,
  patch: {
    index: number
    correctCount: number
    status: QuizBowlAttemptStatus
    finishedAt: number | null
    cooldownUntil: number | null
  },
) {
  if (!db) return
  await updateDoc(doc(db, 'quizBowlAttempts', uid), patch)
}
