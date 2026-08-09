import { Layout } from '../../components/layout/Layout'
import { RequireAuth } from '../../components/auth/RequireAuth'
import { QuizBowlGame } from './QuizBowlGame'

export function QuizBowlPage() {
  return (
    <Layout>
      <RequireAuth>
        <QuizBowlGame />
      </RequireAuth>
    </Layout>
  )
}
