import { Layout } from '../../components/layout/Layout'
import { RequireAuth } from '../../components/auth/RequireAuth'
import { RequireVerifiedEmail } from '../../components/auth/RequireVerifiedEmail'
import { TaskedGame } from './TaskedGame'

export function TaskedPage() {
  return (
    <Layout>
      <RequireAuth>
        <RequireVerifiedEmail>
          <TaskedGame />
        </RequireVerifiedEmail>
      </RequireAuth>
    </Layout>
  )
}
