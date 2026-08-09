import { arrayUnion, doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from './firebase'

const adminEmailsRef = () => doc(db!, 'config', 'adminEmails')

export function subscribeToAdminEmails(onChange: (emails: string[]) => void) {
  if (!db) return () => {}

  return onSnapshot(adminEmailsRef(), (snapshot) => {
    const data = snapshot.data() as { emails?: string[] } | undefined
    onChange(data?.emails ?? [])
  })
}

export async function addAdminEmail(email: string) {
  if (!db) return
  const normalized = email.trim().toLowerCase()
  if (!normalized) return
  await updateDoc(adminEmailsRef(), { emails: arrayUnion(normalized) })
}
