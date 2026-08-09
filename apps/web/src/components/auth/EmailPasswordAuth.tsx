import { useState, type FormEvent } from 'react'
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { friendlyAuthError } from '../../lib/authErrors'

type Mode = 'register' | 'signin'

const MIN_PASSWORD_LENGTH = 8

export function EmailPasswordAuth({ initialMode = 'register' }: { initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const firebaseAuth = auth
  if (!firebaseAuth) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (mode === 'register') {
      if (password.length < MIN_PASSWORD_LENGTH) {
        setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }
    }

    setSubmitting(true)
    try {
      if (mode === 'register') {
        const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password)
        sendEmailVerification(credential.user).catch((err) => {
          console.error('Failed to send verification email:', err)
        })
      } else {
        await signInWithEmailAndPassword(firebaseAuth, email, password)
      }
    } catch (err) {
      setError(friendlyAuthError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-xs">
      <div className="mb-4 flex rounded-full bg-white/10 p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode('register')}
          className={`flex-1 rounded-full py-1.5 transition ${
            mode === 'register' ? 'bg-white text-[#113DCB]' : 'text-white'
          }`}
        >
          Register
        </button>
        <button
          type="button"
          onClick={() => setMode('signin')}
          className={`flex-1 rounded-full py-1.5 transition ${
            mode === 'signin' ? 'bg-white text-[#113DCB]' : 'text-white'
          }`}
        >
          Sign in
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="rounded-md bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40"
        />
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            required
            minLength={mode === 'register' ? MIN_PASSWORD_LENGTH : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-md bg-white/10 px-3 py-2 pr-14 text-sm text-white placeholder:text-white/40"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-white/60 hover:text-white"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {mode === 'register' && (
          <>
            <p className="-mt-1 text-xs text-white/40">
              At least {MIN_PASSWORD_LENGTH} characters.
            </p>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="rounded-md bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40"
            />
            {confirmPassword && (
              <p
                className={`-mt-1 text-xs ${
                  password === confirmPassword ? 'text-emerald-300' : 'text-red-300'
                }`}
              >
                {password === confirmPassword ? 'Passwords match.' : 'Passwords do not match.'}
              </p>
            )}
          </>
        )}
        {error && <p className="text-sm text-red-300">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-[#113DCB] hover:bg-white/90 disabled:opacity-50"
        >
          {mode === 'register' ? 'Create account' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
