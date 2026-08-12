import { Layout } from '../../components/layout/Layout'
import { RequireGameAccess } from '../../components/auth/RequireGameAccess'
import { VotingGame } from './VotingGame'

export function VotingPage() {
  return (
    <Layout>
      <RequireGameAccess>
        <VotingGame />
      </RequireGameAccess>
    </Layout>
  )
}
