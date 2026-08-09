import { useState, type FormEvent } from 'react'
import { updateProfile } from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import type { Gender } from '@tindadventure/shared'
import { auth, db } from '../../lib/firebase'
import { useAuth } from '../../hooks/useAuth'
import { calculateAge } from '../../lib/age'

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'nonbinary', label: 'Non-binary' },
  { value: 'self-describe', label: 'Prefer to self-describe' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
]

const todayISO = new Date().toISOString().slice(0, 10)

export function CompleteProfilePrompt() {
  const { user, refreshUser } = useAuth()
  const [fullName, setFullName] = useState('')
  const [nickname, setNickname] = useState(user?.displayName ?? '')
  const [sitio, setSitio] = useState('')
  const [birthday, setBirthday] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [genderSelfDescribe, setGenderSelfDescribe] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const age = calculateAge(birthday)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!auth?.currentUser || !db || !user) return

    if (!fullName.trim() || !nickname.trim() || !sitio.trim() || !birthday || !gender) {
      setError('Please fill in all fields.')
      return
    }
    if (gender === 'self-describe' && !genderSelfDescribe.trim()) {
      setError('Please tell us how you’d describe your gender.')
      return
    }
    if (!consent) {
      setError('Please acknowledge the data collection notice to continue.')
      return
    }

    setError(null)
    setSubmitting(true)
    try {
      if (nickname.trim() !== user.displayName) {
        await updateProfile(auth.currentUser, { displayName: nickname.trim() })
      }
      await updateDoc(doc(db, 'users', user.uid), {
        fullName: fullName.trim(),
        sitio: sitio.trim(),
        birthday,
        gender,
        genderSelfDescribe: gender === 'self-describe' ? genderSelfDescribe.trim() : null,
        consentAcceptedAt: Date.now(),
      })
      await refreshUser()
    } catch {
      setError('Something went wrong, please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-xs text-center">
      <h2 className="mb-1 text-lg font-semibold text-white">Complete your profile</h2>
      <p className="mb-4 text-sm text-white/60">
        SK Guadalupe collects this for youth profiling (KK Profiling).
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 text-left">
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full name"
          className="rounded-md bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40"
        />
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Nickname"
          className="rounded-md bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40"
        />
        <input
          type="text"
          value={sitio}
          onChange={(e) => setSitio(e.target.value)}
          placeholder="Sitio"
          className="rounded-md bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40"
        />
        <div className="flex flex-col gap-1">
          <input
            type="date"
            value={birthday}
            max={todayISO}
            onChange={(e) => setBirthday(e.target.value)}
            className="rounded-md bg-white/10 px-3 py-2 text-sm text-white [color-scheme:dark]"
          />
          {age !== null && <p className="text-xs text-white/50">{age} years old</p>}
        </div>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value as Gender)}
          className="rounded-md bg-white/10 px-3 py-2 text-sm text-white"
        >
          <option value="" disabled className="text-black">
            Gender
          </option>
          {GENDER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} className="text-black">
              {option.label}
            </option>
          ))}
        </select>
        {gender === 'self-describe' && (
          <input
            type="text"
            value={genderSelfDescribe}
            onChange={(e) => setGenderSelfDescribe(e.target.value)}
            placeholder="How would you describe your gender?"
            className="rounded-md bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40"
          />
        )}

        <label className="mt-2 flex items-start gap-2 text-xs text-white/70">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            I understand that the personal information I provide here (full name, nickname,
            sitio, birthday, and gender) will be collected and used by SK Guadalupe solely for
            youth profiling (KK Profiling), event planning, and program coordination purposes,
            consistent with the Data Privacy Act of 2012 (RA 10173). I consent to this collection
            and processing.
          </span>
        </label>

        {error && <p className="text-sm text-red-300">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !consent}
          className="mt-1 rounded-md bg-white px-4 py-2 text-sm font-medium text-[#113DCB] hover:bg-white/90 disabled:opacity-50"
        >
          Continue
        </button>
      </form>
    </div>
  )
}
