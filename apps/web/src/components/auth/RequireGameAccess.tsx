import { useState, type ReactNode } from 'react'
import { sendEmailVerification } from 'firebase/auth'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { auth } from '../../lib/firebase'
import { isProfileComplete } from '../../lib/profileCompletion'
import { SignInPrompt } from './SignInPrompt'

function GateModal({ emoji, children }: { emoji: string; children: ReactNode }) {
  return (
    <>
      <div aria-hidden="true" className="fixed inset-0 z-40 bg-black/60" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl bg-[#0d2fa0] p-6 text-center text-white ring-1 ring-white/15 sm:p-8">
          <p className="text-4xl">{emoji}</p>
          {children}
          <div className="mt-4">
            <Link to="/games" className="text-sm text-white/60 underline">
              View more games
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

function VerifyEmailGate() {
  const { user, refreshUser } = useAuth()
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [checking, setChecking] = useState(false)

  if (!user) return null

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
    <GateModal emoji="📩">
      <h2 className="mt-3 text-xl font-semibold">Verify your email to play</h2>
      <p className="mt-2 text-sm text-white/70">
        We sent a verification link to <span className="font-medium text-white">{user.email}</span>.
        Click it, then come back here — didn't get it? Check your spam folder, or send a new one
        below.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
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
        <p className="mt-2 text-xs text-red-300">Could not send the email — please try again.</p>
      )}
    </GateModal>
  )
}

function CompleteProfileGate() {
  return (
    <GateModal emoji="📝">
      <h2 className="mt-3 text-xl font-semibold">Complete your KK profile to play</h2>
      <p className="mt-2 text-sm text-white/70">
        SK Guadalupe needs a few details for youth profiling (KK Profiling) before you can join the
        games — it only takes a minute.
      </p>
      <Link
        to="/profile"
        className="mt-5 inline-block rounded-full bg-white px-6 py-2.5 text-sm font-medium text-[#113DCB] hover:bg-white/90"
      >
        Complete my profile
      </Link>
    </GateModal>
  )
}

// Games only: signed in, a complete KK profile, AND a verified email are
// all required to play, checked and messaged in that order — so a player
// missing both sees the profile prompt first, then the email one only
// after that's resolved. Deliberately separate from RequireAuth, which
// still gates Profile/Tickets with the plain inline form (no modal, no
// email-verification requirement) since those aren't "play a game."
export function RequireGameAccess({ children }: { children: ReactNode }) {
  const { user, userDoc, loading } = useAuth()

  if (loading) return null
  if (!user) return <SignInPrompt />
  if (userDoc === null) return null
  if (!isProfileComplete(user, userDoc)) return <CompleteProfileGate />
  if (!user.emailVerified) return <VerifyEmailGate />

  return <>{children}</>
}
