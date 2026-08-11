import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import type { QuizBowlAttemptDoc } from '@tindadventure/shared'
import { db } from './firebase'

// Read-only on purpose — every write to a quizBowlAttempts/{uid} doc
// (starting a round, grading an answer, finishing with a win or loss)
// happens server-side in the startQuizAttempt / submitQuizAnswer Cloud
// Functions (see functions/src/quizBowl.ts and lib/quizBowlPlay.ts).
// That's what makes it impossible for a client to self-declare a win.

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
