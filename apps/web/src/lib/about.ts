import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import type { AboutDoc } from '@tindadventure/shared'
import { db, storage } from './firebase'
import { compressImage } from './image'

export function subscribeToAbout(onChange: (about: AboutDoc | null) => void) {
  if (!db) return () => {}

  return onSnapshot(doc(db, 'config', 'about'), (snapshot) => {
    onChange(snapshot.exists() ? (snapshot.data() as AboutDoc) : null)
  })
}

export async function uploadAboutImage(file: File): Promise<string> {
  if (!storage) throw new Error('Storage is not configured')
  const storageInstance = storage

  const compressed = await compressImage(file)
  const path = `about/${Date.now()}-${compressed.name}`
  const fileRef = ref(storageInstance, path)
  await uploadBytes(fileRef, compressed)
  return getDownloadURL(fileRef)
}

export async function saveAbout(input: { description: string; imageURL: string | null }) {
  if (!db) return

  const about: AboutDoc = {
    description: input.description.trim(),
    imageURL: input.imageURL,
    updatedAt: Date.now(),
  }
  await setDoc(doc(db, 'config', 'about'), about)
}
