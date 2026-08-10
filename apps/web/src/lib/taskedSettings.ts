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

export async function saveTaskedSettings(settings: TaskedSettingsDoc) {
  if (!db) return
  await setDoc(doc(db, 'config', 'taskedSettings'), settings, { merge: true })
}
