import { Link } from 'react-router-dom'

export function BeATindahanCTA() {
  return (
    <Link
      to="/be-a-tindahan"
      className="group flex w-full flex-col items-start gap-5 overflow-hidden rounded-3xl bg-linear-to-br from-amber-400/25 via-white/10 to-transparent p-6 ring-1 ring-amber-300/40 transition hover:ring-amber-300/70 sm:flex-row sm:items-center sm:justify-between sm:p-8"
    >
      <div>
        <p className="text-xs font-semibold tracking-[0.2em] text-amber-300 uppercase">🛍️ Join Us</p>
        <h3 className="mt-1 text-xl font-bold text-white sm:text-2xl">Be one of the Tindahan!</h3>
        <p className="mt-1 text-sm text-white/70">
          Get a FREE booth and ₱3,000 worth of TindaCoupon subsidy for your products or services —
          promote what you sell with guaranteed income.
        </p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#113DCB] transition group-hover:bg-white/90 group-hover:gap-3">
        See Guidelines
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path
            fillRule="evenodd"
            d="M7.21 14.77a.75.75 0 0 1 0-1.06L10.94 10 7.21 6.29a.75.75 0 1 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0Z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    </Link>
  )
}
