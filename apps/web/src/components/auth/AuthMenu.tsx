import { useState } from 'react'
import { Link } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { useAuth } from '../../hooks/useAuth'
import { auth } from '../../lib/firebase'

function UserMenu() {
  const { user, userDoc } = useAuth()
  const [open, setOpen] = useState(false)

  if (!user) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
      >
        {user.displayName}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl bg-[#0d2fa0] py-1 text-sm shadow-xl">
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
