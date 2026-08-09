import { useState } from 'react'
import { sendEmailVerification } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { useAuth } from '../../hooks/useAuth'

export function EmailVerificationBanner() {
  const { user } = useAuth()
  const [dismissed, setDismissed] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')

  if (!user || user.emailVerified || dismissed) return null

  const handleResend = async () => {
    if (!auth?.currentUser) return
    setStatus('sending')
    try {
      await sendEmailVerification(auth.currentUser)
      setStatus('sent')
    } catch {
      setStatus('idle')
    }
  }

  return (
    <div className="mx-6 mt-4 flex items-center justify-between gap-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-sm text-amber-100">
      <div className="flex items-center gap-2.5">
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4 shrink-0 text-amber-400"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.72-1.36 3.486 0l6.28 11.18c.75 1.335-.213 2.987-1.744 2.987H3.72c-1.53 0-2.493-1.652-1.744-2.987l6.28-11.18ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
            clipRule="evenodd"
          />
        </svg>
        <span>
          Please verify your email address.{status === 'sent' && ' Verification email sent.'}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={handleResend}
          disabled={status === 'sending'}
          className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20 disabled:opacity-50"
        >
          Resend email
        </button>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => setDismissed(true)}
          className="rounded-full p-1 text-amber-200/70 hover:bg-white/10 hover:text-amber-100"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
