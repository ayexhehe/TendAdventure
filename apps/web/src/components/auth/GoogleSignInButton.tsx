import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { useAuth } from '../../hooks/useAuth'

const provider = new GoogleAuthProvider()

export function GoogleSignInButton() {
  const { user } = useAuth()

  if (user) {
    return (
      <button
        type="button"
        onClick={() => signOut(auth)}
        className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
      >
        Sign out ({user.displayName})
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => signInWithPopup(auth, provider)}
      className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#113DCB] hover:bg-white/90"
    >
      Sign in with Google
    </button>
  )
}
