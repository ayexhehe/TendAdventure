import { Navigate, useSearchParams } from 'react-router-dom'
import { Layout } from '../../components/layout/Layout'
import { AuthOptions } from '../../components/auth/AuthOptions'
import { CompleteProfilePrompt } from '../../components/auth/CompleteProfilePrompt'
import { useAuth } from '../../hooks/useAuth'
import { isProfileComplete } from '../../lib/profileCompletion'

export function LoginPage() {
  const { user, userDoc } = useAuth()
  const [searchParams] = useSearchParams()

  if (user && userDoc && isProfileComplete(user, userDoc)) {
    return <Navigate to="/" replace />
  }

  const mode = searchParams.get('mode') === 'signin' ? 'signin' : 'register'

  return (
    <Layout>
      <div className="flex w-full flex-1 items-center justify-center">
        <div className="w-full max-w-sm rounded-2xl bg-white/5 p-6">
          {user ? (userDoc === null ? null : <CompleteProfilePrompt />) : (
            <AuthOptions initialMode={mode} />
          )}
        </div>
      </div>
    </Layout>
  )
}
