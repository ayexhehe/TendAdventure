import { addDoc, collection, doc, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore'
import type { MessageWallDoc, MessageWallStatus } from '@tindadventure/shared'
import { db } from './firebase'

export interface MessageWithId extends MessageWallDoc {
  id: string
}

export async function submitMessage(uid: string, displayName: string, text: string): Promise<string> {
  if (!db) throw new Error('Firestore is not configured')

  const message: MessageWallDoc = {
    uid,
    displayName,
    text: text.trim(),
    submittedAt: Date.now(),
    status: 'pending',
    reviewedBy: null,
    reviewedAt: null,
  }
  const ref = await addDoc(collection(db, 'messageWall'), message)
  return ref.id
}

// Sorted client-side (rather than orderBy in the query) so this doesn't
// need a composite index on top of the status equality filter.
export function subscribeToApprovedMessages(onChange: (messages: MessageWithId[]) => void) {
  if (!db) return () => {}
  const q = query(collection(db, 'messageWall'), where('status', '==', 'approved'))
  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as MessageWallDoc) }))
      messages.sort((a, b) => b.submittedAt - a.submittedAt)
      onChange(messages)
    },
    (error) => {
      console.error('Failed to subscribe to message wall:', error)
      onChange([])
    },
  )
}

export function subscribeToAllMessages(onChange: (messages: MessageWithId[]) => void) {
  if (!db) return () => {}
  const q = query(collection(db, 'messageWall'), orderBy('submittedAt', 'desc'))
  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as MessageWallDoc) }))),
    (error) => {
      console.error('Failed to subscribe to message wall (admin):', error)
      onChange([])
    },
  )
}

export async function setMessageStatus(id: string, status: MessageWallStatus, reviewedBy: string) {
  if (!db) return
  await updateDoc(doc(db, 'messageWall', id), {
    status,
    reviewedBy,
    reviewedAt: Date.now(),
  })
}
