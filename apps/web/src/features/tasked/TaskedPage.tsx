import { Layout } from '../../components/layout/Layout'
import { RequireGameAccess } from '../../components/auth/RequireGameAccess'
import { TaskedGame } from './TaskedGame'

export function TaskedPage() {
  return (
    <Layout>
      <RequireGameAccess>
        <TaskedGame />
      </RequireGameAccess>
    </Layout>
  )
}
