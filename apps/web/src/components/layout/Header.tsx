import { Link } from 'react-router-dom'
import { GoogleSignInButton } from '../auth/GoogleSignInButton'

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4">
      <Link to="/" className="text-sm font-semibold tracking-wide text-white">
        TindAdventure
      </Link>
      <GoogleSignInButton />
    </header>
  )
}
