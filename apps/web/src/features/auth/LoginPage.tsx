import { Link, Navigate, useSearchParams } from 'react-router-dom'
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
        <div className="flex w-full max-w-sm flex-col gap-3">
          <Link
            to="/"
            className="flex w-fit items-center gap-1.5 text-sm text-white/60 hover:text-white"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path
                fillRule="evenodd"
                d="M12.79 5.23a.75.75 0 0 1 0 1.06L9.06 10l3.73 3.71a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
                clipRule="evenodd"
              />
            </svg>
            Back
          </Link>
          <div className="rounded-2xl bg-white/5 p-6">
            {user ? (userDoc === null ? null : <CompleteProfilePrompt />) : (
              <AuthOptions initialMode={mode} />
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
