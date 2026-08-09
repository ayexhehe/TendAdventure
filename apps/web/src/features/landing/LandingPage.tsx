import { Link } from 'react-router-dom'
import { Layout } from '../../components/layout/Layout'

export function LandingPage() {
  return (
    <Layout>
      <Link
        to="/quizbowl"
        className="rounded-full bg-white px-8 py-3 text-base font-semibold text-[#113DCB] hover:bg-white/90"
      >
        Play Quiz Bowl
      </Link>
    </Layout>
  )
}
