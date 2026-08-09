import { Link } from 'react-router-dom'

export function ViewAllCard({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/15 transition duration-300 hover:ring-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
    >
      <div className="aspect-video w-full" aria-hidden="true" />
      <div className="min-h-24 w-full" aria-hidden="true" />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition group-hover:bg-white/20">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 0 1 0-1.06L10.94 10 7.21 6.29a.75.75 0 1 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0Z"
              clipRule="evenodd"
            />
          </svg>
        </span>
        <span className="text-sm font-semibold text-white">{label}</span>
      </div>
    </Link>
  )
}
