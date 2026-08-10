import { Link } from 'react-router-dom'

export function BackButton({
  to = '/games',
  className = 'left-0 top-0',
}: {
  to?: string
  className?: string
}) {
  return (
    <Link
      to={to}
      aria-label="Back to games"
      className={`absolute flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 ${className}`}
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path
          fillRule="evenodd"
          d="M12.79 5.23a.75.75 0 0 1 0 1.06L9.06 10l3.73 3.71a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
          clipRule="evenodd"
        />
      </svg>
    </Link>
  )
}
