import { Layout } from '../../components/layout/Layout'
import { RequireAuth } from '../../components/auth/RequireAuth'
import { VotingGame } from './VotingGame'

export function VotingPage() {
  return (
    <Layout>
      <RequireAuth>
        <VotingGame />
      </RequireAuth>
    </Layout>
  )
}
