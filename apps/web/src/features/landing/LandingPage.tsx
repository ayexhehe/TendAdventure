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
    </Layout>
  )
}
