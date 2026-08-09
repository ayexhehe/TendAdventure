import { useState, type FormEvent } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { friendlyAuthError } from '../../lib/authErrors'
import { useAuth } from '../../hooks/useAuth'

type Mode = 'register' | 'signin'

export function EmailPasswordAuth({ initialMode = 'register' }: { initialMode?: Mode }) {
  const { refreshUser } = useAuth()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const firebaseAuth = auth
  if (!firebaseAuth) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (mode === 'register') {
        const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password)
        if (displayName.trim()) {
          await updateProfile(credential.user, { displayName: displayName.trim() })
          await refreshUser()
        }
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
        {mode === 'register' && (
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Display name"
            className="rounded-md bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40"
          />
        )}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="rounded-md bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="rounded-md bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40"
        />
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
