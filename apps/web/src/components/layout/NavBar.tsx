import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/merchants', label: 'Merchants' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/games', label: 'Games' },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition ${isActive ? 'text-white' : 'text-white/60 hover:text-white'}`

export function NavBar() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()

  return (
    <>
      <nav className="hidden items-center gap-6 md:flex">
        {NAV_LINKS.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.to === '/'} className={linkClass}>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="relative md:hidden">
        <button
          type="button"
          aria-label="Toggle navigation menu"
          onClick={() => setOpen((o) => !o)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path
              fillRule="evenodd"
              d="M3 5.75A.75.75 0 0 1 3.75 5h12.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 5.75Zm0 4.25a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 10Zm0 4.25a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {open && (
          <>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-10 cursor-default"
            />
            <div className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-xl bg-[#0d2fa0] py-1 text-sm shadow-xl">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block px-4 py-2 ${isActive ? 'text-white' : 'text-white/70'} hover:bg-white/10`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              {!user && (
                <>
                  <div className="my-1 border-t border-white/10" />
                  <Link
                    to="/login?mode=signin"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2 text-white/70 hover:bg-white/10"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/login?mode=register"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2 font-medium text-white hover:bg-white/10"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
