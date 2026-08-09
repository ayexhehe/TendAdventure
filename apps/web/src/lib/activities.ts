import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import type { ActivityDoc } from '@tindadventure/shared'
import { db, storage } from './firebase'

export interface ActivityWithId extends ActivityDoc {
  id: string
}

export function subscribeToActivities(onChange: (activities: ActivityWithId[]) => void) {
  if (!db) return () => {}

  const q = query(collection(db, 'activities'), orderBy('date'))
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as ActivityDoc) })))
  })
}

export async function uploadActivityImages(files: File[]): Promise<string[]> {
  if (!storage) throw new Error('Storage is not configured')
  const storageInstance = storage

  return Promise.all(
    files.map(async (file) => {
      const path = `activities/${Date.now()}-${file.name}`
      const fileRef = ref(storageInstance, path)
      await uploadBytes(fileRef, file)
      return getDownloadURL(fileRef)
    }),
  )
}

export async function addActivity(input: {
  title: string
  date: string
  committeeHead: string
  location: string
  description: string
  imageURLs: string[]
}) {
  if (!db) return

  const activity: ActivityDoc = {
    title: input.title.trim(),
    date: input.date,
    committeeHead: input.committeeHead.trim(),
    location: input.location.trim(),
    description: input.description.trim(),
    imageURLs: input.imageURLs,
    createdAt: Date.now(),
  }
  await addDoc(collection(db, 'activities'), activity)
}

export async function updateActivity(
  id: string,
  input: {
    title: string
    date: string
    committeeHead: string
    location: string
    description: string
    imageURLs: string[]
    createdAt: number
  },
) {
  if (!db) return

  const activity: ActivityDoc = {
    title: input.title.trim(),
    date: input.date,
    committeeHead: input.committeeHead.trim(),
    location: input.location.trim(),
    description: input.description.trim(),
    imageURLs: input.imageURLs,
    createdAt: input.createdAt,
  }
  await setDoc(doc(db, 'activities', id), activity)
}

export async function deleteActivity(id: string) {
  if (!db) return
  await deleteDoc(doc(db, 'activities', id))
}
