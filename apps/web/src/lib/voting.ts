import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import type { VotingCategoryDoc, VotingPerformerDoc, VoteDoc } from '@tindadventure/shared'
import { db, storage } from './firebase'
import { compressImage } from './image'

export interface VotingCategoryWithId extends VotingCategoryDoc {
  id: string
}

export interface VotingPerformerWithId extends VotingPerformerDoc {
  id: string
}

export function subscribeToVotingCategories(onChange: (categories: VotingCategoryWithId[]) => void) {
  if (!db) return () => {}
  const q = query(collection(db, 'votingCategories'), orderBy('order'))
  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as VotingCategoryDoc) }))),
    (error) => {
      console.error('Failed to subscribe to voting categories:', error)
      onChange([])
    },
  )
}

export function subscribeToVotingPerformers(onChange: (performers: VotingPerformerWithId[]) => void) {
  if (!db) return () => {}
  return onSnapshot(
    collection(db, 'votingPerformers'),
    (snapshot) => onChange(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as VotingPerformerDoc) }))),
    (error) => {
      console.error('Failed to subscribe to voting performers:', error)
      onChange([])
    },
  )
}

export async function uploadVotingPerformerImage(file: File): Promise<string> {
  if (!storage) throw new Error('Storage is not configured')
  const compressed = await compressImage(file)
  const path = `votingPerformers/${Date.now()}-${compressed.name}`
  const fileRef = ref(storage, path)
  await uploadBytes(fileRef, compressed)
  return getDownloadURL(fileRef)
}

export async function addVotingCategory(name: string, order: number) {
  if (!db) return
  const category: VotingCategoryDoc = { name: name.trim(), order, hidden: false, createdAt: Date.now() }
  await setDoc(doc(collection(db, 'votingCategories')), category)
}

export async function updateVotingCategory(id: string, name: string, order: number) {
  if (!db) return
  await setDoc(doc(db, 'votingCategories', id), { name: name.trim(), order }, { merge: true })
}

export async function setVotingCategoryHidden(id: string, hidden: boolean) {
  if (!db) return
  await setDoc(doc(db, 'votingCategories', id), { hidden }, { merge: true })
}

// Cascades to every performer under this category so voting never ends up
// pointing at an orphaned category.
export async function deleteVotingCategory(id: string) {
  if (!db) return
  const firestore = db
  const performersSnap = await getDocs(query(collection(firestore, 'votingPerformers'), where('categoryId', '==', id)))
  await Promise.all(performersSnap.docs.map((d) => deleteDoc(d.ref)))
  await deleteDoc(doc(firestore, 'votingCategories', id))
}

interface VotingPerformerInput {
  categoryId: string
  name: string
  photoURL: string | null
  description: string
}

export async function addVotingPerformer(input: VotingPerformerInput) {
  if (!db) return
  const performer: VotingPerformerDoc = {
    categoryId: input.categoryId,
    name: input.name.trim(),
    photoURL: input.photoURL,
    description: input.description.trim(),
    voteCount: 0,
    createdAt: Date.now(),
  }
  await setDoc(doc(collection(db, 'votingPerformers')), performer)
}

export async function updateVotingPerformer(id: string, input: VotingPerformerInput) {
  if (!db) return
  const ref2 = doc(db, 'votingPerformers', id)
  const existing = (await getDoc(ref2)).data() as VotingPerformerDoc | undefined
  const performer: VotingPerformerDoc = {
    categoryId: input.categoryId,
    name: input.name.trim(),
    photoURL: input.photoURL,
    description: input.description.trim(),
    voteCount: existing?.voteCount ?? 0,
    createdAt: existing?.createdAt ?? Date.now(),
  }
  await setDoc(ref2, performer)
}

export async function deleteVotingPerformer(id: string) {
  if (!db) return
  await deleteDoc(doc(db, 'votingPerformers', id))
}

export function subscribeToMyVotes(uid: string, onChange: (votes: VoteDoc[]) => void) {
  if (!db) return () => {}
  const q = query(collection(db, 'votes'), where('uid', '==', uid))
  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.docs.map((d) => d.data() as VoteDoc)),
    (error) => {
      console.error('Failed to subscribe to votes:', error)
      onChange([])
    },
  )
}

export async function castVote(uid: string, categoryId: string, performerId: string) {
  if (!db) return
  const vote: VoteDoc = { uid, categoryId, performerId, votedAt: Date.now() }
  await setDoc(doc(db, 'votes', `${uid}_${categoryId}`), vote)
}
