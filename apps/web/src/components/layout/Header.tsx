import { Link } from 'react-router-dom'
import { AuthMenu } from '../auth/AuthMenu'
import mainLogo from '../../assets/main-logo.svg'

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4">
      <Link to="/">
        <img src={mainLogo} alt="Linggo ng Kabataan sa Guadalupe" className="h-24 w-auto" />
      </Link>
      <AuthMenu />
    </header>
  )
}
