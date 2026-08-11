import { Layout } from '../../components/layout/Layout'
import { RequireAuth } from '../../components/auth/RequireAuth'
import { RequireVerifiedEmail } from '../../components/auth/RequireVerifiedEmail'
import { QuizBowlGame } from './QuizBowlGame'

export function QuizBowlPage() {
  return (
    <Layout>
      <RequireAuth>
        <RequireVerifiedEmail>
          <QuizBowlGame />
        </RequireVerifiedEmail>
      </RequireAuth>
    </Layout>
  )
}
