import { useEffect, useState } from 'react'
import type { CurrentStatus } from '@tindadventure/shared'
import { deleteUserProfile, subscribeToUsers, type UserWithId } from '../../lib/users'
import { isProfileDataComplete } from '../../lib/profileCompletion'
import { calculateAge } from '../../lib/age'

const PROVIDER_LABEL: Record<UserWithId['provider'], string> = {
  'google.com': 'Google',
  password: 'Email/password',
  unknown: 'Unknown',
}

const GENDER_LABEL: Record<string, string> = {
  male: 'Male',
  female: 'Female',
  nonbinary: 'Non-binary',
  'self-describe': 'Prefer to self-describe',
  'prefer-not-to-say': 'Prefer not to say',
}

const STATUS_LABEL: Record<CurrentStatus, string> = {
  student: 'Student',
  employed: 'Employed',
  'self-employed': 'Self-Employed / Business Owner',
  'looking-for-work': 'Looking for Work',
  'not-studying-or-working': 'Not Currently Studying or Working',
  other: 'Other',
}

const STUDENT_LEVEL_LABEL: Record<string, string> = {
  'junior-high': 'Junior High School',
  'senior-high': 'Senior High School',
  college: 'College',
}

function formatGender(u: UserWithId): string {
  if (!u.gender) return '—'
  if (u.gender === 'self-describe' && u.genderSelfDescribe) return u.genderSelfDescribe
  return GENDER_LABEL[u.gender] ?? '—'
}

function formatStatus(u: UserWithId): string {
  if (!u.currentStatus) return '—'
  if (u.currentStatus === 'student') {
    const level = u.studentLevel ? STUDENT_LEVEL_LABEL[u.studentLevel] : null
    return level ? `Student — ${level}` : 'Student'
  }
  if (u.currentStatus === 'other' && u.currentStatusOther) return u.currentStatusOther
  return STATUS_LABEL[u.currentStatus] ?? '—'
}

function formatList(items: string[] | undefined, other: string | null | undefined): string {
  if (!items?.length) return '—'
  return items.map((item) => (item === 'Other' && other ? other : item)).join(', ')
}

function formatDateTime(ms: number | null | undefined): string {
  if (!ms) return '—'
  return new Date(ms).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
}

function VerificationBadge({ verified }: { verified: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        verified ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-200'
      }`}
    >
      {verified ? 'Verified' : 'Unverified'}
    </span>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2 text-sm">
      <dt className="text-white/50">{label}</dt>
      <dd className="col-span-2 text-white/90">{children}</dd>
    </div>
  )
}

function UserInfoModal({ user, onClose }: { user: UserWithId; onClose: () => void }) {
  const age = calculateAge(user.birthday)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 bg-black/60"
      />
      <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[#0d2fa0] p-6 text-white ring-1 ring-white/15">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{user.displayName || '—'}</h3>
            <p className="text-sm text-white/60">{user.fullName || '—'}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <section className="rounded-xl bg-white/5 p-4">
          <h4 className="text-xs font-semibold tracking-wide text-white/40 uppercase">Account</h4>
          <dl className="divide-y divide-white/10">
            <InfoRow label="Email">{user.email}</InfoRow>
            <InfoRow label="Signed in via">{PROVIDER_LABEL[user.provider]}</InfoRow>
            <InfoRow label="Role">{user.role}</InfoRow>
            <InfoRow label="Joined">{formatDateTime(user.createdAt)}</InfoRow>
          </dl>
        </section>

        <section className="mt-3 rounded-xl bg-white/5 p-4">
          <h4 className="text-xs font-semibold tracking-wide text-white/40 uppercase">KK Profile</h4>
          <dl className="divide-y divide-white/10">
            <InfoRow label="Sitio">{user.sitio || '—'}</InfoRow>
            <InfoRow label="Birthday">
              {user.birthday ? `${user.birthday}${age !== null ? ` (${age} yrs old)` : ''}` : '—'}
            </InfoRow>
            <InfoRow label="Gender">{formatGender(user)}</InfoRow>
            <InfoRow label="Current status">{formatStatus(user)}</InfoRow>
            <InfoRow label="Skills / talents">{formatList(user.skills, user.skillsOther)}</InfoRow>
            <InfoRow label="Interests">{formatList(user.interests, user.interestsOther)}</InfoRow>
            <InfoRow label="Consent accepted">{formatDateTime(user.consentAcceptedAt)}</InfoRow>
          </dl>
          {user.skVoice && (
            <div className="mt-2 border-t border-white/10 pt-2">
              <p className="text-xs text-white/50">What they'd want from the SK</p>
              <p className="mt-1 text-sm whitespace-pre-line text-white/90">{user.skVoice}</p>
            </div>
          )}
        </section>

        <section className="mt-3 rounded-xl bg-white/5 p-4">
          <h4 className="text-xs font-semibold tracking-wide text-white/40 uppercase">Game progress</h4>
          <dl className="divide-y divide-white/10">
            <InfoRow label="Quiz Bowl">{user.quizBowl?.hasWon ? 'Won' : '—'}</InfoRow>
            <InfoRow label="taSKed">{user.tasked?.ticketAwarded ? 'Completed' : '—'}</InfoRow>
          </dl>
        </section>
      </div>
    </div>
  )
}

function DeleteButton({
  user,
  onDeleted,
}: {
  user: UserWithId
  onDeleted: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleConfirm = async () => {
    if (confirmText.trim().toUpperCase() !== 'DELETE') return
    setDeleting(true)
    try {
      await deleteUserProfile(user.id)
      onDeleted()
    } finally {
      setDeleting(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="DELETE"
          autoFocus
          className="w-20 rounded-md bg-white/10 px-2 py-1 text-xs text-white placeholder:text-white/30"
        />
        <button
          type="button"
          aria-label="Confirm delete"
          onClick={() => void handleConfirm()}
          disabled={deleting || confirmText.trim().toUpperCase() !== 'DELETE'}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path
              fillRule="evenodd"
              d="M16.704 5.29a1 1 0 0 1 0 1.415l-7.5 7.5a1 1 0 0 1-1.414 0l-3.5-3.5a1 1 0 1 1 1.414-1.414L8.5 12.086l6.79-6.79a1 1 0 0 1 1.414-.006Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Cancel delete"
          onClick={() => {
            setConfirming(false)
            setConfirmText('')
          }}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      aria-label={`Delete ${user.displayName || user.email}`}
      onClick={() => setConfirming(true)}
      className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/15 text-red-300 hover:bg-red-500/25 hover:text-red-200"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
        <path
          fillRule="evenodd"
          d="M8.75 1a.75.75 0 0 0-.75.75V3H4.5a.75.75 0 0 0 0 1.5h.322l.734 10.276A2.75 2.75 0 0 0 8.298 17h3.404a2.75 2.75 0 0 0 2.742-2.224L15.178 4.5H15.5a.75.75 0 0 0 0-1.5H12v-1.25a.75.75 0 0 0-.75-.75h-2.5ZM10 4.5h2.5-5H10Zm-2.984 1.5.719 10.06a1.25 1.25 0 0 0 1.246 1.16h3.038a1.25 1.25 0 0 0 1.246-1.16L13.984 6H7.016Z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  )
}

export function UsersTab() {
  const [users, setUsers] = useState<UserWithId[]>([])
  const [infoUser, setInfoUser] = useState<UserWithId | null>(null)

  useEffect(() => subscribeToUsers(setUsers), [])

  return (
    <div className="w-full text-white">
      <section className="overflow-hidden rounded-2xl bg-white/5">
        <h2 className="px-6 pt-5 text-lg font-semibold">Users ({users.length})</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/10 text-white/60">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">KK Profile</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-white/10">
                  <td className="px-6 py-3">{u.displayName || '—'}</td>
                  <td className="px-6 py-3 text-white/70">{u.email}</td>
                  <td className="px-6 py-3">
                    <VerificationBadge verified={isProfileDataComplete(u)} />
                  </td>
                  <td className="px-6 py-3 text-white/70">{u.role}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`View ${u.displayName || u.email}`}
                        onClick={() => setInfoUser(u)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a1 1 0 0 0 0 2v3a1 1 0 0 0 1 1h1a1 1 0 1 0 0-2v-3a1 1 0 0 0-1-1H9Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      <DeleteButton user={u} onDeleted={() => setInfoUser(null)} />
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-white/50" colSpan={5}>
                    No registered users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {infoUser && <UserInfoModal user={infoUser} onClose={() => setInfoUser(null)} />}
    </div>
  )
}
