import type { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { RequireAuth } from './RequireAuth'

function AdminGate({ children }: { children: ReactNode }) {
  const { userDoc } = useAuth()

  // userDoc is briefly null right after sign-in while Firestore delivers
  // the profile that ensureUserDocument just created — treat that as
  // still loading rather than "not admin" to avoid a false flash.
  if (userDoc === null) return null

  if (userDoc.role !== 'admin') {
    return <p className="text-lg text-white">Not authorized</p>
  }

  return <>{children}</>
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AdminGate>{children}</AdminGate>
    </RequireAuth>
  )
}
