import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import type { UserDoc } from '@tindadventure/shared'
import { db } from './firebase'

export interface UserWithId extends UserDoc {
  id: string
}

export function subscribeToUsers(onChange: (users: UserWithId[]) => void) {
  if (!db) return () => {}

  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as UserDoc) })))
  })
}
