import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { formatCooldown } from '../../lib/time'

export function GameCard({
  to,
  title,
  description,
  comingSoon,
  continueAvailable,
  cooldownUntil,
  icon,
}: {
  to: string
  title: string
  description: string
  comingSoon?: boolean
  continueAvailable?: boolean
  cooldownUntil?: number | null
  icon: ReactNode
}) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!cooldownUntil) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [cooldownUntil])

  const cooldownRemaining = cooldownUntil ? cooldownUntil - now : 0
  const inCooldown = cooldownRemaining > 0

  return (
    <Link
      to={to}
      className={`relative flex items-center gap-4 rounded-2xl p-5 transition ${
        comingSoon ? 'bg-white/5 hover:bg-white/10' : 'bg-white/10 hover:bg-white/15'
      }`}
    >
      {comingSoon && (
        <span className="absolute right-4 top-4 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/80">
          Coming soon
        </span>
      )}
      {continueAvailable && (
        <span className="absolute right-4 top-4 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          Continue
        </span>
      )}
      {inCooldown && (
        <span className="absolute right-4 top-4 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          Available in {formatCooldown(cooldownRemaining)}
        </span>
      )}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="text-sm text-white/60">{description}</p>
      </div>
    </Link>
  )
}
