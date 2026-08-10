import { useState } from 'react'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { friendlyAuthError } from '../../lib/authErrors'

const provider = new GoogleAuthProvider()

export function GoogleSignInButton() {
  const firebaseAuth = auth
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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

  const handleClick = async () => {
    setError(null)
    setSubmitting(true)
    try {
      await signInWithPopup(firebaseAuth, provider)
    } catch (err) {
      setError(friendlyAuthError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={submitting}
        className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#113DCB] hover:bg-white/90 disabled:opacity-50"
      >
        Sign in with Google
      </button>
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  )
}