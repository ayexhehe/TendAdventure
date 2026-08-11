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
  writeBatch,
  type DocumentReference,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import type { VotingCategoryDoc, VotingPerformerDoc, VotingResultDoc, VoteDoc } from '@tindadventure/shared'
import { db, storage } from './firebase'
import { compressImage } from './image'
import { getGameSettings } from './gameSettings'

const BATCH_SIZE = 400

async function commitInBatches(
  refs: DocumentReference[],
  apply: (batch: ReturnType<typeof writeBatch>, ref: DocumentReference) => void,
) {
  if (!db) return
  for (let i = 0; i < refs.length; i += BATCH_SIZE) {
    const batch = writeBatch(db)
    for (const ref of refs.slice(i, i + BATCH_SIZE)) apply(batch, ref)
    await batch.commit()
  }
}

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

// Admin-only (enforced by rules, not just this check) — live vote tallies,
// kept in a separate collection from the public performer docs so results
// stay sealed from voters while a round is running.
export function subscribeToVotingResults(onChange: (results: Record<string, number>) => void) {
  if (!db) return () => {}
  return onSnapshot(
    collection(db, 'votingResults'),
    (snapshot) => {
      const results: Record<string, number> = {}
      snapshot.docs.forEach((d) => {
        results[d.id] = (d.data() as VotingResultDoc).voteCount ?? 0
      })
      onChange(results)
    },
    (error) => {
      console.error('Failed to subscribe to voting results:', error)
      onChange({})
    },
  )
}

async function assertRoundNotLive(message: string): Promise<void> {
  const settings = await getGameSettings()
  const windowEndsAt = settings?.votingWindowEndsAt
  if (windowEndsAt != null && Date.now() < windowEndsAt) {
    throw new Error(message)
  }
}

// Refuses to delete a performer/category that already has votes, or while
// a round is currently live — either one risks silently destroying real
// vote data (voteCount lives only on the result doc, with no other copy)
// or pulling a choice out from under someone mid-vote. Callers should
// steer admins toward "Hide" instead, which preserves everything.
async function assertSafeToRemoveVotingContent(): Promise<void> {
  await assertRoundNotLive('Cannot delete while a round is live — stop the round first, or hide it instead.')
}

async function performerHasVotes(performerId: string): Promise<boolean> {
  if (!db) return false
  const snap = await getDoc(doc(db, 'votingResults', performerId))
  const voteCount = snap.exists() ? ((snap.data() as VotingResultDoc).voteCount ?? 0) : 0
  return voteCount > 0
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
// pointing at an orphaned category. Refuses if a round is live, or if any
// performer in the category already has votes — see
// assertSafeToRemoveVotingContent / performerHasVotes above.
export async function deleteVotingCategory(id: string) {
  if (!db) return
  const firestore = db
  await assertSafeToRemoveVotingContent()
  const performersSnap = await getDocs(query(collection(firestore, 'votingPerformers'), where('categoryId', '==', id)))
  const votedFlags = await Promise.all(performersSnap.docs.map((d) => performerHasVotes(d.id)))
  if (votedFlags.some(Boolean)) {
    throw new Error('Cannot delete — this category has performers with existing votes. Hide it instead.')
  }
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
    createdAt: existing?.createdAt ?? Date.now(),
  }
  await setDoc(ref2, performer)
}

// Refuses if a round is live, or if this performer already has votes —
// see assertSafeToRemoveVotingContent / performerHasVotes above.
export async function deleteVotingPerformer(id: string) {
  if (!db) return
  await assertSafeToRemoveVotingContent()
  if (await performerHasVotes(id)) {
    throw new Error('Cannot delete — this performer already has votes. Hide their category instead.')
  }
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

// Admin-only (enforced by rules, not just this check). Wipes every vote
// and every result tally so voting starts fresh — e.g. between testing
// passes, or if the same categories get reused for a genuinely separate
// election later. Deliberately leaves TindaCoupons untouched: a vote reset
// is not a prize reset, so nothing already awarded is taken back — that
// stays a separate, existing action (Tickets tab / coupon reset settings).
// Refuses while a round is live, since resetting votes out from under
// people actively voting would corrupt their in-progress state.
export async function resetAllVotes(): Promise<number> {
  if (!db) return 0
  await assertRoundNotLive('Cannot reset votes while a round is live — stop the round first.')
  const [votesSnap, resultsSnap] = await Promise.all([
    getDocs(collection(db, 'votes')),
    getDocs(collection(db, 'votingResults')),
  ])
  await commitInBatches(
    [...votesSnap.docs.map((d) => d.ref), ...resultsSnap.docs.map((d) => d.ref)],
    (batch, ref) => batch.delete(ref),
  )
  return votesSnap.size
}
