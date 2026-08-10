import { collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore'
import type { UserDoc } from '@tindadventure/shared'
import { db } from './firebase'

export interface UserWithId extends UserDoc {
  id: string
}

export function subscribeToUsers(onChange: (users: UserWithId[]) => void) {
  if (!db) return () => {}

  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snapshot) => {
      onChange(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as UserDoc) })))
    },
    (error) => {
      console.error('Failed to subscribe to users:', error)
      onChange([])
    },
  )
}

export async function recordQuizBowlWin(uid: string) {
  if (!db) return
  await updateDoc(doc(db, 'users', uid), {
    quizBowl: { hasWon: true, wonAt: Date.now() },
  })
}

export async function recordTaskedWin(uid: string) {
  if (!db) return
  await updateDoc(doc(db, 'users', uid), {
    tasked: { ticketAwarded: true, completedAt: Date.now() },
  })
}
