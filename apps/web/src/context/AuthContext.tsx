import { createContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import type { UserDoc } from '@tindadventure/shared'
import { auth, db } from '../lib/firebase'
import { ensureUserDocument } from '../lib/ensureUserDocument'

interface AuthContextValue {
  user: User | null
  userDoc: UserDoc | null
  loading: boolean
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  userDoc: null,
  loading: true,
  refreshUser: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
      if (!nextUser) setUserDoc(null)
    })
  }, [])

  useEffect(() => {
    if (!db || !user) return

    ensureUserDocument(user)

    return onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      setUserDoc(snapshot.exists() ? (snapshot.data() as UserDoc) : null)
    })
  }, [user])

  // Firebase doesn't re-fire onAuthStateChanged after updateProfile(), so
  // consumers that just changed the profile (e.g. setting displayName
  // right after registration) need to explicitly ask for a refresh —
  // otherwise `user` stays a stale pre-update snapshot. Cloning preserves
  // the User instance's prototype/methods while giving React a new
  // reference to actually notice the change.
  const refreshUser = async () => {
    if (!auth?.currentUser) return
    await auth.currentUser.reload()
    const refreshed = auth.currentUser
    if (refreshed) {
      setUser(Object.assign(Object.create(Object.getPrototypeOf(refreshed)), refreshed))
    }
  }

  return (
    <AuthContext.Provider value={{ user, userDoc, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}
