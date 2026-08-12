import { Layout } from '../../components/layout/Layout'
import { RequireGameAccess } from '../../components/auth/RequireGameAccess'
import { QuizBowlGame } from './QuizBowlGame'

export function QuizBowlPage() {
  return (
    <Layout>
      <RequireGameAccess>
        <QuizBowlGame />
      </RequireGameAccess>
    </Layout>
  )
}
