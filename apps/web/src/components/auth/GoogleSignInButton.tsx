import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '../../lib/firebase'

const provider = new GoogleAuthProvider()

export function GoogleSignInButton() {
  const firebaseAuth = auth

  if (!firebaseAuth) {
    return (
      <button
        type="button"
        disabled
        title="Firebase is not configured yet"
        className="cursor-not-allowed rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/50"
      >
        Sign in with Google
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => signInWithPopup(firebaseAuth, provider)}
      className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#113DCB] hover:bg-white/90"
    >
      Sign in with Google
    </button>
  )
}
