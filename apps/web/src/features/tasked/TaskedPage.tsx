import { Layout } from '../../components/layout/Layout'
import { RequireAuth } from '../../components/auth/RequireAuth'

export function TaskedPage() {
  return (
    <Layout>
      <RequireAuth>
        <p className="text-lg text-white">taSKed — coming soon</p>
      </RequireAuth>
    </Layout>
  )
}
