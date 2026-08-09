import { Link } from 'react-router-dom'
import { Layout } from '../../components/layout/Layout'
import logo from '../../assets/logo.png'

export function LandingPage() {
  return (
    <Layout>
      <img
        src={logo}
        alt="Linggo ng Kabataan sa Guadalupe"
        className="w-full max-w-md"
      />
      <Link
        to="/quizbowl"
        className="mt-6 rounded-full bg-white px-8 py-3 text-base font-semibold text-[#113DCB] hover:bg-white/90"
      >
        Play Quiz Bowl
      </Link>
    </Layout>
  )
}
