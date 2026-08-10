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

// Resets every player's taSKed progress and win flag — including
// players who already won. Each player's personal share slug is kept
// intact so links they've already shared keep working; only their
// progress and click counts are wiped.
export async function resetAllTaskedPlayers(): Promise<number> {
  if (!db) return 0

  const entrantsSnapshot = await getDocs(collection(db, 'taskedEntrants'))
  await commitInBatches(
    entrantsSnapshot.docs.map((d) => d.ref),
    (batch, ref) =>
      batch.update(ref, {
        task1ClickCount: 0,
        task1CompletedAt: null,
        task2PostLink: null,
        task2CompletedAt: null,
        task3MessageId: null,
        task3CompletedAt: null,
        allTasksCompletedAt: null,
      }),
  )

  const clickLogsSnapshot = await getDocs(collection(db, 'taskedClickLogs'))
  await commitInBatches(
    clickLogsSnapshot.docs.map((d) => d.ref),
    (batch, ref) => batch.delete(ref),
  )

  const wonUsersSnapshot = await getDocs(query(collection(db, 'users'), where('tasked.ticketAwarded', '==', true)))
  await commitInBatches(
    wonUsersSnapshot.docs.map((d) => d.ref),
    (batch, ref) => batch.update(ref, { tasked: { ticketAwarded: false, completedAt: null } }),
  )

  return entrantsSnapshot.size
}
