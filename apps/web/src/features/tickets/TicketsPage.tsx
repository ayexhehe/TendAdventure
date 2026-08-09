import { Layout } from '../../components/layout/Layout'
import { RequireAuth } from '../../components/auth/RequireAuth'

export function TicketsPage() {
  return (
    <Layout>
      <RequireAuth>
        <div />
      </RequireAuth>
    </Layout>
  )
}
