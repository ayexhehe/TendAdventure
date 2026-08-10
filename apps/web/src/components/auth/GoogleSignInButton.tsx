import { useEffect, useState } from 'react'
import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { friendlyAuthError } from '../../lib/authErrors'

const provider = new GoogleAuthProvider()

// Popup-based OAuth is unreliable on mobile browsers (iOS Safari in
// particular silently fails it due to ITP/third-party storage
// restrictions), so mobile falls back to a full-page redirect flow.
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

export function GoogleSignInButton() {
  const firebaseAuth = auth
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!firebaseAuth) return
    getRedirectResult(firebaseAuth).catch((err) => setError(friendlyAuthError(err)))
  }, [firebaseAuth])

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
    if (isMobile) {
      await signInWithRedirect(firebaseAuth, provider)
      return
    }
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
