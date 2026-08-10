import { Layout } from '../../components/layout/Layout'
import { RequireAuth } from '../../components/auth/RequireAuth'
import { TaskedGame } from './TaskedGame'

export function TaskedPage() {
  return (
    <Layout>
      <RequireAuth>
        <TaskedGame />
      </RequireAuth>
    </Layout>
  )
}
