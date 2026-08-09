import { useState } from 'react'
import { Link } from 'react-router-dom'
import { signOut, sendEmailVerification } from 'firebase/auth'
import { useAuth } from '../../hooks/useAuth'
import { auth } from '../../lib/firebase'

function VerificationBadge({ verified }: { verified: boolean }) {
  return (
    <span
      className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-[#113DCB] ${
        verified ? 'bg-emerald-500' : 'bg-red-500'
      }`}
    >
      {verified ? (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-2.5 w-2.5 text-white">
          <path
            fillRule="evenodd"
            d="M16.704 5.29a1 1 0 0 1 0 1.415l-7.5 7.5a1 1 0 0 1-1.414 0l-3.5-3.5a1 1 0 1 1 1.414-1.414L8.5 12.086l6.79-6.79a1 1 0 0 1 1.414-.006Z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <span className="text-[9px] font-bold leading-none text-white">!</span>
      )}
    </span>
  )
}

function UserMenu() {
  const { user, userDoc } = useAuth()
  const [open, setOpen] = useState(false)
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle')

  if (!user) return null

  const verified = user.emailVerified

  const handleResend = async () => {
    if (!auth?.currentUser) return
    setResendStatus('sending')
    try {
      await sendEmailVerification(auth.currentUser)
      setResendStatus('sent')
    } catch (err) {
      console.error('Failed to resend verification email:', err)
      setResendStatus('idle')
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full bg-white px-4 py-2 text-sm font-medium text-[#113DCB] hover:bg-white/90"
      >
        {user.displayName}
        <VerificationBadge verified={verified} />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl bg-[#0d2fa0] py-1 text-sm shadow-xl">
            {!verified && (
              <div className="border-b border-white/10 px-4 py-2.5">
                <p className="flex items-center gap-1.5 font-medium text-red-300">
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold leading-none text-white">
                    !
                  </span>
                  Email not verified
                </p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendStatus === 'sending'}
                  className="mt-1 text-xs font-medium text-white/70 underline hover:text-white disabled:opacity-50"
                >
                  {resendStatus === 'sent' ? 'Verification email sent' : 'Resend verification email'}
                </button>
              </div>
            )}
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-white hover:bg-white/10"
            >
              Profile
            </Link>
            {userDoc?.role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-white hover:bg-white/10"
              >
                Admin Panel
              </Link>
            )}
            <Link
              to="/tickets"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-white hover:bg-white/10"
            >
              Tickets
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                if (auth) signOut(auth)
              }}
              className="block w-full px-4 py-2 text-left text-white hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export function AuthMenu() {
  const { user } = useAuth()

  if (user) {
    return <UserMenu />
  }

  return (
    <div className="flex gap-2">
      <Link
        to="/login?mode=signin"
        className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
      >
        Sign in
      </Link>
      <Link
        to="/login?mode=register"
        className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#113DCB] hover:bg-white/90"
      >
        Register
      </Link>
    </div>
  )
}
