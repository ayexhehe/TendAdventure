import { Navigate, useSearchParams } from 'react-router-dom'
import { Layout } from '../../components/layout/Layout'
import { AuthOptions } from '../../components/auth/AuthOptions'
import { useAuth } from '../../hooks/useAuth'

export function LoginPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

  if (user) {
    return <Navigate to="/" replace />
  }

  const mode = searchParams.get('mode') === 'signin' ? 'signin' : 'register'

  return (
    <Layout>
      <div className="w-full max-w-sm rounded-2xl bg-white/5 p-6">
        <AuthOptions initialMode={mode} />
      </div>
    </Layout>
  )
}
