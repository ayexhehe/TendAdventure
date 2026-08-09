import { useState } from 'react'
import { sendEmailVerification, updateProfile } from 'firebase/auth'
import { Layout } from '../../components/layout/Layout'
import { RequireAuth } from '../../components/auth/RequireAuth'
import { useAuth } from '../../hooks/useAuth'
import { auth } from '../../lib/firebase'
import { calculateAge } from '../../lib/age'

const PROVIDER_LABEL: Record<string, string> = {
  'google.com': 'Google',
  password: 'Email/password',
}

const GENDER_LABEL: Record<string, string> = {
  male: 'Male',
  female: 'Female',
  nonbinary: 'Non-binary',
  'self-describe': 'Prefer to self-describe',
  'prefer-not-to-say': 'Prefer not to say',
}

function formatGender(
  gender: string | null | undefined,
  selfDescribe: string | null | undefined,
): string {
  if (!gender) return '—'
  if (gender === 'self-describe' && selfDescribe) return selfDescribe
  return GENDER_LABEL[gender] ?? '—'
}

function formatBirthday(birthday: string | null | undefined): string {
  if (!birthday) return '—'
  const age = calculateAge(birthday)
  if (age === null) return birthday
  return `${birthday} (${age} yrs old)`
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="text-white/50">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  )
}

function VerifiedMark({ verified }: { verified: boolean }) {
  return (
    <span
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
        verified ? 'bg-emerald-500' : 'bg-red-500'
      }`}
      title={verified ? 'Email verified' : 'Email not verified'}
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

function NicknameHeading() {
  const { user, refreshUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(user?.displayName ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user) return null

  const handleSave = async () => {
    const trimmed = value.trim()
    if (!trimmed) {
      setError('Nickname cannot be empty.')
      return
    }
    if (!auth?.currentUser) return
    setError(null)
    setSaving(true)
    try {
      await updateProfile(auth.currentUser, { displayName: trimmed })
      await refreshUser()
      setEditing(false)
    } catch {
      setError('Something went wrong, please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <input
            type="text"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="rounded-md bg-white/10 px-3 py-1.5 text-xl font-semibold text-white"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-[#113DCB] hover:bg-white/90 disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false)
              setValue(user.displayName ?? '')
              setError(null)
            }}
            className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20"
          >
            Cancel
          </button>
        </div>
        {error && <p className="text-xs text-red-300">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <h1 className="text-2xl font-semibold">{user.displayName || '—'}</h1>
      <VerifiedMark verified={user.emailVerified} />
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs font-medium text-white/50 underline hover:text-white"
      >
        Edit
      </button>
    </div>
  )
}

function ProfileDetails() {
  const { user, userDoc } = useAuth()
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  if (!user) return null

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
    <div className="w-full max-w-3xl text-white">
      <div className="mb-8 flex items-center gap-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 text-xl font-semibold">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="h-full w-full object-cover" />
          ) : (
            getInitials(user.displayName || userDoc?.fullName || '?')
          )}
        </div>
        <div>
          <NicknameHeading />
          <p className="text-white/60">{userDoc?.fullName || '—'}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl bg-white/5 p-5">
          <h2 className="mb-1 text-xs font-semibold tracking-wide text-white/40 uppercase">
            Account
          </h2>
          <dl className="divide-y divide-white/10 text-sm">
            <Row label="Email">
              <div>{user.email}</div>
              {!user.emailVerified && (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendStatus === 'sending'}
                  className="text-xs font-medium text-amber-300 underline hover:text-amber-200 disabled:opacity-50"
                >
                  {resendStatus === 'sent' ? 'Verification email sent' : 'Resend verification email'}
                </button>
              )}
            </Row>
            <Row label="Signed in via">
              {userDoc ? (PROVIDER_LABEL[userDoc.provider] ?? 'Unknown') : '—'}
            </Row>
          </dl>
        </section>

        <section className="rounded-2xl bg-white/5 p-5">
          <h2 className="mb-1 text-xs font-semibold tracking-wide text-white/40 uppercase">
            KK Profile
          </h2>
          <dl className="divide-y divide-white/10 text-sm">
            <Row label="Sitio">{userDoc?.sitio || '—'}</Row>
            <Row label="Birthday">{formatBirthday(userDoc?.birthday)}</Row>
            <Row label="Gender">{formatGender(userDoc?.gender, userDoc?.genderSelfDescribe)}</Row>
          </dl>
        </section>
      </div>
    </div>
  )
}

export function ProfilePage() {
  return (
    <Layout>
      <RequireAuth>
        <ProfileDetails />
      </RequireAuth>
    </Layout>
  )
}
