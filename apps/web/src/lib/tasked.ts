import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import type { TaskedEntrantDoc, TaskedSlugDoc } from '@tindadventure/shared'
import { db } from './firebase'

export const TASKED_TASK1_TARGET = 3

function generateSlug(): string {
  return Math.random().toString(36).slice(2, 10)
}

function blankEntrant(uid: string, slug: string): TaskedEntrantDoc {
  return {
    uid,
    personalShareSlug: slug,
    task1ClickCount: 0,
    task1CompletedAt: null,
    task2PostLink: null,
    task2CompletedAt: null,
    task3MessageId: null,
    task3CompletedAt: null,
    allTasksCompletedAt: null,
  }
}

export async function ensureEntrant(uid: string, displayName: string): Promise<TaskedEntrantDoc> {
  if (!db) return blankEntrant(uid, '')

  const ref = doc(db, 'taskedEntrants', uid)
  const snapshot = await getDoc(ref)
  if (snapshot.exists()) return snapshot.data() as TaskedEntrantDoc

  const entrant = blankEntrant(uid, generateSlug())
  await setDoc(ref, entrant)
  await setDoc(doc(db, 'taskedSlugs', entrant.personalShareSlug), {
    uid,
    displayName,
    createdAt: Date.now(),
  })
  return entrant
}

export function subscribeToEntrant(uid: string, onChange: (entrant: TaskedEntrantDoc | null) => void) {
  if (!db) return () => {}
  return onSnapshot(
    doc(db, 'taskedEntrants', uid),
    (snapshot) => onChange(snapshot.exists() ? (snapshot.data() as TaskedEntrantDoc) : null),
    (error) => {
      console.error('Failed to subscribe to tasked entrant:', error)
      onChange(null)
    },
  )
}

export async function resolveSlug(slug: string): Promise<TaskedSlugDoc | null> {
  if (!db) return null
  const snapshot = await getDoc(doc(db, 'taskedSlugs', slug))
  return snapshot.exists() ? (snapshot.data() as TaskedSlugDoc) : null
}

export async function logInviteClick(ownerUid: string, visitorId: string) {
  if (!db) return
  await addDoc(collection(db, 'taskedClickLogs'), {
    ownerUid,
    visitorId,
    clickedAt: Date.now(),
  })
}

export function subscribeToClickCount(ownerUid: string, onChange: (count: number) => void) {
  if (!db) return () => {}
  const q = query(collection(db, 'taskedClickLogs'), where('ownerUid', '==', ownerUid))
  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.size),
    (error) => {
      console.error('Failed to subscribe to invite click count:', error)
      onChange(0)
    },
  )
}

export async function completeTask1IfReady(uid: string, clickCount: number) {
  if (!db || clickCount < TASKED_TASK1_TARGET) return
  await updateDoc(doc(db, 'taskedEntrants', uid), {
    task1ClickCount: clickCount,
    task1CompletedAt: Date.now(),
  })
}

export function isFacebookLink(url: string): boolean {
  try {
    const parsed = new URL(url.trim())
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '')
    return (
      host === 'facebook.com' ||
      host === 'm.facebook.com' ||
      host === 'web.facebook.com' ||
      host === 'fb.watch' ||
      host.endsWith('.facebook.com')
    )
  } catch {
    return false
  }
}

export async function submitTask2(uid: string, link: string) {
  if (!db) return
  await updateDoc(doc(db, 'taskedEntrants', uid), {
    task2PostLink: link.trim(),
    task2CompletedAt: Date.now(),
  })
}

export async function submitTask3(uid: string, messageId: string) {
  if (!db) return
  await updateDoc(doc(db, 'taskedEntrants', uid), {
    task3MessageId: messageId,
    task3CompletedAt: Date.now(),
  })
}

export async function completeAllTasksIfReady(uid: string, entrant: TaskedEntrantDoc) {
  if (!db || entrant.allTasksCompletedAt) return
  if (!entrant.task1CompletedAt || !entrant.task2CompletedAt || !entrant.task3CompletedAt) return
  await updateDoc(doc(db, 'taskedEntrants', uid), { allTasksCompletedAt: Date.now() })
}
