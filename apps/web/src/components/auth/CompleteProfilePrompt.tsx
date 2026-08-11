import { useState, type FormEvent, type InputHTMLAttributes } from 'react'
import { updateProfile } from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import type { CurrentStatus, Gender, StudentLevel } from '@tindadventure/shared'
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

const STATUS_OPTIONS: { value: CurrentStatus; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'employed', label: 'Employed' },
  { value: 'self-employed', label: 'Self-Employed / Business Owner' },
  { value: 'looking-for-work', label: 'Looking for Work' },
  { value: 'not-studying-or-working', label: 'Not Currently Studying or Working' },
  { value: 'other', label: 'Other' },
]

const STUDENT_LEVEL_OPTIONS: { value: StudentLevel; label: string }[] = [
  { value: 'junior-high', label: 'Junior High School' },
  { value: 'senior-high', label: 'Senior High School' },
  { value: 'college', label: 'College' },
]

const SKILL_OPTIONS = [
  'Sports / Athletics',
  'Singing',
  'Musical Instruments',
  'Dancing',
  'Acting / Theater',
  'Drawing / Visual Arts',
  'Photography / Videography',
  'Graphic Design',
  'Writing',
  'Public Speaking',
  'Leadership',
  'Cooking / Baking',
  'Entrepreneurship / Business',
  'Technology / Programming',
  'Other',
]

const INTEREST_OPTIONS = [
  'Sports & Recreation',
  'Music',
  'Arts & Culture',
  'Education & Learning',
  'Leadership & Youth Development',
  'Entrepreneurship & Livelihood',
  'Career & Employment',
  'Technology & Digital Skills',
  'Community Service / Volunteerism',
  'Environmental Activities',
  'Competitions & Events',
  'Health & Wellness',
  'Other',
]

const todayISO = new Date().toISOString().slice(0, 10)

const fieldClass =
  'peer w-full rounded-md bg-white/10 px-3 pt-5 pb-2 text-sm text-white [color-scheme:dark]'

function FloatingLabel({ text, floated }: { text: string; floated: boolean }) {
  return (
    <span
      className={`pointer-events-none absolute left-3 transition-all duration-150 ${
        floated ? 'top-1.5 text-[10px] text-white/50' : 'top-1/2 -translate-y-1/2 text-sm text-white/40'
      }`}
    >
      {text}
    </span>
  )
}

function FloatingInput({
  label,
  value,
  ...rest
}: { label: string; value: string } & InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false)
  // Date inputs always render their own "mm/dd/yyyy" placeholder text,
  // regardless of value — there's no visually-empty state to center the
  // label in, so it stays floated permanently instead of overlapping it.
  const floated = focused || value.length > 0 || rest.type === 'date'
  return (
    <div className="relative">
      <input
        {...rest}
        value={value}
        onFocus={(e) => {
          setFocused(true)
          rest.onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          rest.onBlur?.(e)
        }}
        className={fieldClass}
      />
      <FloatingLabel text={label} floated={floated} />
    </div>
  )
}

// A single-select dropdown styled to match the rest of the form — a plain
// <select>'s options popup is rendered by the OS/browser itself and can't
// be dark-themed, so this opens its own styled overlay panel instead.
function FloatingDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const floated = open || value.length > 0
  const selectedLabel = options.find((o) => o.value === value)?.label ?? ''

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${fieldClass} flex items-center justify-between gap-2 text-left`}
      >
        <span className={`truncate ${selectedLabel ? 'text-white' : 'text-transparent'}`}>
          {selectedLabel || ' '}
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 shrink-0 text-white/50 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <FloatingLabel text={label} floated={floated} />

      {open && (
        <>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10"
          />
          <div className="absolute z-20 mt-1.5 max-h-60 w-full overflow-y-auto rounded-md bg-[#0d2fa0] p-1.5 ring-1 ring-white/15">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className={`block w-full rounded-md px-2.5 py-2 text-left text-sm transition ${
                  value === option.value ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/5'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// A "select all that apply" multi-select, collapsed into a dropdown
// instead of a big always-open checkbox grid — the closed button shows a
// comma-joined summary of what's picked so far, and opens an overlay
// panel of checkboxes on tap, closing on an outside click.
function MultiSelectDropdown({
  label,
  hint,
  options,
  selected,
  onToggle,
}: {
  label: string
  hint: string
  options: string[]
  selected: string[]
  onToggle: (option: string) => void
}) {
  const [open, setOpen] = useState(false)
  const floated = open || selected.length > 0

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${fieldClass} flex items-center justify-between gap-2 text-left`}
      >
        <span className={`truncate ${selected.length ? 'text-white' : 'text-transparent'}`}>
          {selected.length > 0 ? selected.join(', ') : ' '}
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 shrink-0 text-white/50 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <FloatingLabel text={label} floated={floated} />

      {open && (
        <>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10"
          />
          <div className="absolute z-20 mt-1.5 max-h-60 w-full overflow-y-auto rounded-md bg-[#0d2fa0] p-1.5 ring-1 ring-white/15">
            <p className="px-2 pt-1 pb-2 text-[11px] text-white/40">{hint}</p>
            {options.map((option) => (
              <label
                key={option}
                className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition ${
                  selected.includes(option) ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/5'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => onToggle(option)}
                  className="shrink-0"
                />
                {option}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function CompleteProfilePrompt() {
  const { user, refreshUser } = useAuth()
  const [fullName, setFullName] = useState(user?.displayName ?? '')
  const [nickname, setNickname] = useState('')
  const [sitio, setSitio] = useState('')
  const [birthday, setBirthday] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [genderSelfDescribe, setGenderSelfDescribe] = useState('')
  const [currentStatus, setCurrentStatus] = useState<CurrentStatus | ''>('')
  const [studentLevel, setStudentLevel] = useState<StudentLevel | ''>('')
  const [currentStatusOther, setCurrentStatusOther] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [skillsOther, setSkillsOther] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [interestsOther, setInterestsOther] = useState('')
  const [skVoice, setSkVoice] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const age = calculateAge(birthday)
  const toggleSkill = (option: string) =>
    setSkills((prev) => (prev.includes(option) ? prev.filter((s) => s !== option) : [...prev, option]))
  const toggleInterest = (option: string) =>
    setInterests((prev) => (prev.includes(option) ? prev.filter((s) => s !== option) : [...prev, option]))

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
    if (!currentStatus) {
      setError('Please select your current status.')
      return
    }
    if (currentStatus === 'student' && !studentLevel) {
      setError('Please select your education level.')
      return
    }
    if (currentStatus === 'other' && !currentStatusOther.trim()) {
      setError('Please specify your current status.')
      return
    }
    if (skills.length === 0) {
      setError('Please select at least one skill or talent.')
      return
    }
    if (skills.includes('Other') && !skillsOther.trim()) {
      setError('Please specify your other skill or talent.')
      return
    }
    if (interests.length === 0) {
      setError('Please select at least one interest.')
      return
    }
    if (interests.includes('Other') && !interestsOther.trim()) {
      setError('Please specify your other interest.')
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
        currentStatus,
        studentLevel: currentStatus === 'student' ? studentLevel : null,
        currentStatusOther: currentStatus === 'other' ? currentStatusOther.trim() : null,
        skills,
        skillsOther: skills.includes('Other') ? skillsOther.trim() : null,
        interests,
        interestsOther: interests.includes('Other') ? interestsOther.trim() : null,
        skVoice: skVoice.trim(),
        consentAcceptedAt: Date.now(),
      })
      await refreshUser()
    } catch {
      setError('Something went wrong, please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md text-center">
      <h2 className="mb-1 text-lg font-semibold text-white">Complete your profile</h2>
      <p className="mb-4 text-sm text-white/60">
        SK Guadalupe collects this for youth profiling (KK Profiling).
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
        <div className="flex flex-col gap-3">
          <FloatingInput
            type="text"
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <FloatingInput
            type="text"
            label="Nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          <FloatingInput
            type="text"
            label="Sitio"
            value={sitio}
            onChange={(e) => setSitio(e.target.value)}
          />
          <div className="flex flex-col gap-1">
            <FloatingInput
              type="date"
              label="Birthday"
              value={birthday}
              max={todayISO}
              onChange={(e) => setBirthday(e.target.value)}
            />
            {age !== null && <p className="text-xs text-white/50">{age} years old</p>}
          </div>
          <FloatingDropdown
            label="Gender"
            value={gender}
            options={GENDER_OPTIONS}
            onChange={(v) => setGender(v as Gender)}
          />
          {gender === 'self-describe' && (
            <FloatingInput
              type="text"
              label="How would you describe your gender?"
              value={genderSelfDescribe}
              onChange={(e) => setGenderSelfDescribe(e.target.value)}
            />
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
          <p className="text-xs font-semibold tracking-wide text-white/40 uppercase">
            Education / Employment
          </p>
          <FloatingDropdown
            label="Current status"
            value={currentStatus}
            options={STATUS_OPTIONS}
            onChange={(v) => setCurrentStatus(v as CurrentStatus)}
          />
          {currentStatus === 'student' && (
            <FloatingDropdown
              label="Education level"
              value={studentLevel}
              options={STUDENT_LEVEL_OPTIONS}
              onChange={(v) => setStudentLevel(v as StudentLevel)}
            />
          )}
          {currentStatus === 'other' && (
            <FloatingInput
              type="text"
              label="Please specify"
              value={currentStatusOther}
              onChange={(e) => setCurrentStatusOther(e.target.value)}
            />
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
          <MultiSelectDropdown
            label="Skills / talents"
            hint="Select all that apply"
            options={SKILL_OPTIONS}
            selected={skills}
            onToggle={toggleSkill}
          />
          {skills.includes('Other') && (
            <FloatingInput
              type="text"
              label="Please specify"
              value={skillsOther}
              onChange={(e) => setSkillsOther(e.target.value)}
            />
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
          <MultiSelectDropdown
            label="Interests"
            hint="Select all that apply"
            options={INTEREST_OPTIONS}
            selected={interests}
            onToggle={toggleInterest}
          />
          {interests.includes('Other') && (
            <FloatingInput
              type="text"
              label="Please specify"
              value={interestsOther}
              onChange={(e) => setInterestsOther(e.target.value)}
            />
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 pt-4">
          <p className="text-xs font-semibold tracking-wide text-white/40 uppercase">
            Your Voice <span className="text-white/30 normal-case">(optional)</span>
          </p>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-white/50">
              What program or support would you like from the SK?
            </span>
            <textarea
              value={skVoice}
              onChange={(e) => setSkVoice(e.target.value)}
              rows={3}
              placeholder="Tell us what programs, activities, or support you'd like the SK Council to provide."
              className="w-full resize-none rounded-md bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30"
            />
          </label>
        </div>

        <label className="mt-1 flex items-start gap-2 text-xs text-white/70">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            I understand that the personal information I provide here (full name, nickname,
            sitio, birthday, gender, education/employment status, skills, and interests) will be
            collected and used by SK Guadalupe solely for youth profiling (KK Profiling), event
            planning, and program coordination purposes, consistent with the Data Privacy Act of
            2012 (RA 10173). I consent to this collection and processing.
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
