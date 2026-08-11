import { Layout } from '../../components/layout/Layout'
import { RequireAuth } from '../../components/auth/RequireAuth'
import { RequireVerifiedEmail } from '../../components/auth/RequireVerifiedEmail'
import { VotingGame } from './VotingGame'

export function VotingPage() {
  return (
    <Layout>
      <RequireAuth>
        <RequireVerifiedEmail>
          <VotingGame />
        </RequireVerifiedEmail>
      </RequireAuth>
    </Layout>
  )
}
