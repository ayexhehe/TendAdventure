import { Layout } from '../../components/layout/Layout'
import { RequireAuth } from '../../components/auth/RequireAuth'
import { useAuth } from '../../hooks/useAuth'

const PROVIDER_LABEL: Record<string, string> = {
  'google.com': 'Google',
  password: 'Email/password',
}

function ProfileDetails() {
  const { user, userDoc } = useAuth()
  if (!user) return null

  return (
    <div className="w-full max-w-sm text-white">
      <h2 className="mb-4 text-lg font-semibold">Profile</h2>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between border-b border-white/10 pb-2">
          <dt className="text-white/60">Name</dt>
          <dd>{user.displayName || '—'}</dd>
        </div>
        <div className="flex justify-between border-b border-white/10 pb-2">
          <dt className="text-white/60">Email</dt>
          <dd>{user.email}</dd>
        </div>
        <div className="flex justify-between border-b border-white/10 pb-2">
          <dt className="text-white/60">Signed in via</dt>
          <dd>{userDoc ? (PROVIDER_LABEL[userDoc.provider] ?? 'Unknown') : '—'}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-white/60">Role</dt>
          <dd>{userDoc?.role ?? '—'}</dd>
        </div>
      </dl>
    </div>
  )
}

export function ProfilePage() {
  return (
    <Layout>
      <RequireAuth>
        <ProfileDetails />
      </RequireAuth>
    </Layout>
  )
}
