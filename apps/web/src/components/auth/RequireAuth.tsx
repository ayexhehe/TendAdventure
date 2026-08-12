import type { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { SignInPrompt } from './SignInPrompt'
import { CompleteProfilePrompt } from './CompleteProfilePrompt'
import { isProfileComplete } from '../../lib/profileCompletion'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, userDoc, loading } = useAuth()

  if (loading) return null

  if (!user) return <SignInPrompt />

  if (userDoc === null) return null

  if (!isProfileComplete(user, userDoc)) {
    return <CompleteProfilePrompt />
  }

  return <>{children}</>
}
