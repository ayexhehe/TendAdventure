import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import type { GameSettingsDoc } from '@tindadventure/shared'
import { db } from './firebase'

export async function getGameSettings(): Promise<GameSettingsDoc | null> {
  if (!db) return null
  const snapshot = await getDoc(doc(db, 'config', 'gameSettings'))
  return snapshot.exists() ? (snapshot.data() as GameSettingsDoc) : null
}

export function subscribeToGameSettings(onChange: (settings: GameSettingsDoc | null) => void) {
  if (!db) return () => {}
  return onSnapshot(
    doc(db, 'config', 'gameSettings'),
    (snapshot) => onChange(snapshot.exists() ? (snapshot.data() as GameSettingsDoc) : null),
    (error) => {
      console.error('Failed to subscribe to game settings:', error)
      onChange(null)
    },
  )
}

export async function saveGameSettings(patch: Partial<GameSettingsDoc>) {
  if (!db) return
  await setDoc(doc(db, 'config', 'gameSettings'), patch, { merge: true })
}
