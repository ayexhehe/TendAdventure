import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import type { UserDoc } from '@tindadventure/shared'
import { auth, db } from './firebase'

export async function ensureUserDocument(user: User) {
  if (!db) return

  const ref = doc(db, 'users', user.uid)
  const snapshot = await getDoc(ref)

  // Prefer auth.currentUser over the `user` param: a caller may have just
  // run updateProfile() (e.g. setting displayName right after
  // registration), which doesn't re-fire onAuthStateChanged, so `user`
  // here can be a stale pre-update snapshot even though the real profile
  // has already changed by the time this async function resolves.
  const current = auth?.currentUser?.uid === user.uid ? auth.currentUser : user

  if (!snapshot.exists()) {
    const providerId = current.providerData[0]?.providerId
    const newUser: UserDoc = {
      displayName: current.displayName ?? '',
      email: current.email ?? '',
      photoURL: current.photoURL ?? null,
      provider: providerId === 'google.com' || providerId === 'password' ? providerId : 'unknown',
      createdAt: Date.now(),
      role: 'player',
      fullName: '',
      sitio: '',
      birthday: null,
      gender: null,
      genderSelfDescribe: null,
      consentAcceptedAt: null,
      currentStatus: null,
      studentLevel: null,
      currentStatusOther: null,
      skills: [],
      skillsOther: null,
      interests: [],
      interestsOther: null,
      skVoice: '',
      quizBowl: { hasWon: false, wonAt: null },
      tasked: { ticketAwarded: false, completedAt: null },
    }
    await setDoc(ref, newUser)
  } else {
    const existing = snapshot.data() as UserDoc
    const patch: Partial<Pick<UserDoc, 'displayName' | 'photoURL'>> = {}
    if (current.displayName && current.displayName !== existing.displayName) {
      patch.displayName = current.displayName
    }
    if (current.photoURL !== existing.photoURL) {
      patch.photoURL = current.photoURL
    }
    if (Object.keys(patch).length > 0) {
      await updateDoc(ref, patch).catch(() => {})
    }
  }

  // Sync admin status: this only succeeds server-side (per the Firestore
  // rules) if the signed-in user's email is on the admin allowlist. For
  // everyone else it's a normal, expected permission-denied — the
  // allowlist itself is never exposed to the client.
  try {
    await updateDoc(ref, { role: 'admin' })
  } catch {
    // not an allowlisted admin — expected for regular players.
  }
}
