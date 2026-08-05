import { Link } from 'react-router-dom'
import { Layout } from './layout/Layout'

export function NotFoundPage() {
  return (
    <Layout>
      <p className="text-lg text-white">Page not found</p>
      <Link to="/" className="mt-2 text-sm text-white/80 underline">
        Back home
      </Link>
    </Layout>
  )
}
