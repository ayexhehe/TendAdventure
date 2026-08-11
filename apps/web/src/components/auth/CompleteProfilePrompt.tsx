import { useState, type FormEvent, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
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
  const floated = focused || value.length > 0
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

function FloatingSelect({
  label,
  value,
  children,
  ...rest
}: { label: string; value: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  const [focused, setFocused] = useState(false)
  const floated = focused || value.length > 0
  return (
    <div className="relative">
      <select
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
      >
        {children}
      </select>
      <FloatingLabel text={label} floated={floated} />
    </div>
  )
}

function CheckboxGroup({
  legend,
  hint,
  options,
  selected,
  onToggle,
}: {
  legend: string
  hint: string
  options: string[]
  selected: string[]
  onToggle: (option: string) => void
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-xs font-medium text-white/50">
        {legend} <span className="text-white/30">— {hint}</span>
      </legend>
      <div className="mt-1 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
              selected.includes(option) ? 'bg-white/20 text-white' : 'bg-white/5 text-white/70'
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
    </fieldset>
  )
}

export function CompleteProfilePrompt() {
  const { user, refreshUser } = useAuth()
  const [fullName, setFullName] = useState('')
  const [nickname, setNickname] = useState(user?.displayName ?? '')
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
          <FloatingSelect
            label="Gender"
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender)}
          >
            <option value="" disabled hidden />
            {GENDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="text-black">
                {option.label}
              </option>
            ))}
          </FloatingSelect>
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
          <FloatingSelect
            label="Current status"
            value={currentStatus}
            onChange={(e) => setCurrentStatus(e.target.value as CurrentStatus)}
          >
            <option value="" disabled hidden />
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="text-black">
                {option.label}
              </option>
            ))}
          </FloatingSelect>
          {currentStatus === 'student' && (
            <FloatingSelect
              label="Education level"
              value={studentLevel}
              onChange={(e) => setStudentLevel(e.target.value as StudentLevel)}
            >
              <option value="" disabled hidden />
              {STUDENT_LEVEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="text-black">
                  {option.label}
                </option>
              ))}
            </FloatingSelect>
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
          <p className="text-xs font-semibold tracking-wide text-white/40 uppercase">
            Skills / Talents
          </p>
          <CheckboxGroup
            legend="What are your skills or talents?"
            hint="select all that apply"
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
          <p className="text-xs font-semibold tracking-wide text-white/40 uppercase">Interests</p>
          <CheckboxGroup
            legend="What are you interested in?"
            hint="select all that apply"
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
