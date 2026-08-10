import {
  type DocumentReference,
  collection,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'

const BATCH_SIZE = 400

async function commitInBatches(
  refs: DocumentReference[],
  apply: (batch: ReturnType<typeof writeBatch>, ref: DocumentReference) => void,
) {
  if (!db) return
  for (let i = 0; i < refs.length; i += BATCH_SIZE) {
    const batch = writeBatch(db)
    for (const ref of refs.slice(i, i + BATCH_SIZE)) apply(batch, ref)
    await batch.commit()
  }
}

// Clears cooldownUntil on every player currently waiting out a loss, so
// they can retry immediately instead of waiting out the 30 minutes.
// Leaves in-progress and already-won attempts untouched.
export async function resetAllCooldowns(): Promise<number> {
  if (!db) return 0
  const snapshot = await getDocs(query(collection(db, 'quizBowlAttempts'), where('status', '==', 'lost')))
  await commitInBatches(
    snapshot.docs.map((d) => d.ref),
    (batch, ref) => batch.update(ref, { cooldownUntil: null }),
  )
  return snapshot.size
}

// Wipes every player's Quiz Bowl attempt, win flag, and seen-question
// history, so everyone — including players who already won — can play a
// completely fresh round again.
export async function resetAllPlayers(): Promise<number> {
  if (!db) return 0

  const attemptsSnapshot = await getDocs(collection(db, 'quizBowlAttempts'))
  await commitInBatches(
    attemptsSnapshot.docs.map((d) => d.ref),
    (batch, ref) => batch.delete(ref),
  )

  const seenSnapshot = await getDocs(collection(db, 'quizBowlSeenQuestions'))
  await commitInBatches(
    seenSnapshot.docs.map((d) => d.ref),
    (batch, ref) => batch.delete(ref),
  )

  const wonUsersSnapshot = await getDocs(query(collection(db, 'users'), where('quizBowl.hasWon', '==', true)))
  await commitInBatches(
    wonUsersSnapshot.docs.map((d) => d.ref),
    (batch, ref) => batch.update(ref, { quizBowl: { hasWon: false, wonAt: null } }),
  )

  return attemptsSnapshot.size
}
