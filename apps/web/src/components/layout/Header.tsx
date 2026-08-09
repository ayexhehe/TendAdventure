import { Link } from 'react-router-dom'
import { AuthMenu } from '../auth/AuthMenu'
import { NavBar } from './NavBar'
import mainLogo from '../../assets/main-logo.svg'
import skLogo from '../../assets/skLogo.svg'

export function Header() {
  return (
    <header className="flex items-center justify-between gap-4 px-6 py-4">
      <Link to="/" className="flex shrink-0 items-center gap-3">
        <img src={skLogo} alt="SK Guadalupe" className="h-14 mb-2 w-auto" />
         <img src={mainLogo} alt="Linggo ng Kabataan sa Guadalupe" className="h-24 w-auto" />
      </Link>
      <div className="flex items-center gap-6">
        <NavBar />
        <AuthMenu />
      </div>
    </header>
  )
}
