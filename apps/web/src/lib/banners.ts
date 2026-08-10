import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import type { BannerDoc } from '@tindadventure/shared'
import { db, storage } from './firebase'
import { compressImage } from './image'

export interface BannerWithId extends BannerDoc {
  id: string
}

export function subscribeToBanners(onChange: (banners: BannerWithId[]) => void) {
  if (!db) return () => {}

  const q = query(collection(db, 'banners'), orderBy('order'))
  return onSnapshot(
    q,
    (snapshot) => {
      onChange(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as BannerDoc) })))
    },
    (error) => {
      console.error('Failed to subscribe to banners:', error)
      onChange([])
    },
  )
}

export async function uploadBannerImage(file: File): Promise<string> {
  if (!storage) throw new Error('Storage is not configured')
  const storageInstance = storage

  const compressed = await compressImage(file, { maxDimension: 1920 })
  const path = `banners/${Date.now()}-${compressed.name}`
  const fileRef = ref(storageInstance, path)
  await uploadBytes(fileRef, compressed)
  return getDownloadURL(fileRef)
}

export async function addBanner(input: {
  imageURL: string
  caption: string
  order: number
  linkTo?: string | null
}) {
  if (!db) return

  const banner: BannerDoc = {
    imageURL: input.imageURL,
    caption: input.caption.trim(),
    order: input.order,
    linkTo: input.linkTo?.trim() || null,
    createdAt: Date.now(),
  }
  await addDoc(collection(db, 'banners'), banner)
}

export async function updateBanner(
  id: string,
  input: { imageURL: string; caption: string; order: number; linkTo: string | null; createdAt: number },
) {
  if (!db) return

  const banner: BannerDoc = {
    imageURL: input.imageURL,
    caption: input.caption.trim(),
    order: input.order,
    linkTo: input.linkTo?.trim() || null,
    createdAt: input.createdAt,
  }
  await setDoc(doc(db, 'banners', id), banner)
}

export async function deleteBanner(id: string) {
  if (!db) return
  await deleteDoc(doc(db, 'banners', id))
}
