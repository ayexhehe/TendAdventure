import { useState, type ReactNode } from 'react'
import { sendEmailVerification } from 'firebase/auth'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { auth } from '../../lib/firebase'

export function RequireVerifiedEmail({ children }: { children: ReactNode }) {
  const { user, refreshUser } = useAuth()
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [checking, setChecking] = useState(false)

  if (!user || user.emailVerified) return <>{children}</>

  const handleResend = async () => {
    if (!auth?.currentUser) return
    setResendStatus('sending')
    try {
      await sendEmailVerification(auth.currentUser)
      setResendStatus('sent')
    } catch {
      setResendStatus('error')
    }
  }

  const handleCheckAgain = async () => {
    setChecking(true)
    await refreshUser()
    setChecking(false)
  }

  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-4 rounded-2xl bg-amber-400/10 p-6 text-center text-white ring-1 ring-amber-400/30 sm:p-8">
      <p className="text-4xl">📩</p>
      <div>
        <h2 className="text-xl font-semibold">Verify your email to play</h2>
        <p className="mt-2 text-sm text-white/70">
          We sent a verification link to <span className="font-medium text-white">{user.email}</span>.
          Click it, then come back here — didn't get it? Check your spam folder, or send a new one
          below.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => void handleCheckAgain()}
          disabled={checking}
          className="rounded-full bg-white px-6 py-2 text-sm font-medium text-[#113DCB] hover:bg-white/90 disabled:opacity-50"
        >
          {checking ? 'Checking…' : "I've verified — check again"}
        </button>
        <button
          type="button"
          onClick={() => void handleResend()}
          disabled={resendStatus === 'sending'}
          className="rounded-full bg-white/10 px-6 py-2 text-sm font-medium text-white hover:bg-white/20 disabled:opacity-50"
        >
          {resendStatus === 'sending'
            ? 'Sending…'
            : resendStatus === 'sent'
              ? 'New link sent!'
              : 'Send new link'}
        </button>
      </div>
      {resendStatus === 'error' && (
        <p className="text-xs text-red-300">Could not send the email — please try again.</p>
      )}
      <Link to="/games" className="text-sm text-white/60 underline">
        View more games
      </Link>
    </div>
  )
}
