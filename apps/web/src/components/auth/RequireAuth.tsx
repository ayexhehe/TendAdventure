import type { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { AuthOptions } from './AuthOptions'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return null

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-lg text-white">Sign in to continue</p>
        <AuthOptions />
      </div>
    )
  }

  return <>{children}</>
}
