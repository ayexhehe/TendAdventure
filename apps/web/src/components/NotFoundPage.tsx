import { Link } from 'react-router-dom'
import { Layout } from './layout/Layout'

export function NotFoundPage() {
  return (
    <Layout>
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-2">
        <p className="text-lg text-white">Page not found</p>
        <Link to="/" className="text-sm text-white/80 underline">
          Back home
        </Link>
      </div>
    </Layout>
  )
}
