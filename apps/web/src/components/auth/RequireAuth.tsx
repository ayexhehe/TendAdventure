import type { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { AuthOptions } from './AuthOptions'
import { CompleteProfilePrompt } from './CompleteProfilePrompt'
import { isProfileComplete } from '../../lib/profileCompletion'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, userDoc, loading } = useAuth()

  if (loading) return null

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-lg text-white">Sign in to continue</p>
        <AuthOptions />
      </div>
    )
  }

  if (userDoc === null) return null

  if (!isProfileComplete(user, userDoc)) {
    return <CompleteProfilePrompt />
  }

  return <>{children}</>
}
