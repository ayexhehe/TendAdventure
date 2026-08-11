import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import type { TaskedSettingsDoc } from '@tindadventure/shared'
import { db } from './firebase'

export async function getTaskedSettings(): Promise<TaskedSettingsDoc | null> {
  if (!db) return null
  const snapshot = await getDoc(doc(db, 'config', 'taskedSettings'))
  return snapshot.exists() ? (snapshot.data() as TaskedSettingsDoc) : null
}

export function subscribeToTaskedSettings(onChange: (settings: TaskedSettingsDoc | null) => void) {
  if (!db) return () => {}
  return onSnapshot(
    doc(db, 'config', 'taskedSettings'),
    (snapshot) => onChange(snapshot.exists() ? (snapshot.data() as TaskedSettingsDoc) : null),
    (error) => {
      console.error('Failed to subscribe to tasked settings:', error)
      onChange(null)
    },
  )
}

export async function saveTaskedSettings(settings: Partial<TaskedSettingsDoc>) {
  if (!db) return
  await setDoc(doc(db, 'config', 'taskedSettings'), settings, { merge: true })
}

// Used whenever an admin hasn't customized the Task 1 share message yet
// — both as the default shown in the General panel's textarea, and as
// what the game itself falls back to.
export const DEFAULT_TASK1_SHARE_MESSAGE = [
  '🎉 FROM ONE YOUTH TO ANOTHER — GUADAHIUSA NA! 💙',
  '',
  'Kauban ang SK Guadalupe Council sa pag-celebrate sa Linggo ng Kabataan 2026! ✨',
  '',
  'Naay games 🎮, youth stalls 🛍️, TindaCoupon prizes 🎟️, ug live music 🎶 from our young local talents! 🎤🔥',
  '',
  'Bangon na, og kaligo na dira! 😂',
  'Kuyog ta, magka-kita kita ta diri! 🤙💙',
  '',
  '🎶 GUADAHIUSA — Youth Arts and Music Festival 2026',
].join('\n')
