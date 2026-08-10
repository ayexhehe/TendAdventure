import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { formatCooldown } from '../../lib/time'

const RING_SIZE = 56
const RING_STROKE = 3
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function ProgressRing({ progress }: { progress: number }) {
  const clamped = Math.min(1, Math.max(0, progress))
  return (
    <svg
      width={RING_SIZE}
      height={RING_SIZE}
      viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
      className="pointer-events-none absolute inset-0 -rotate-90"
    >
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={RING_STROKE}
      />
      {clamped > 0 && (
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke="#10b981"
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE * (1 - clamped)}
          className="transition-[stroke-dashoffset] duration-500"
        />
      )}
    </svg>
  )
}

export function GameCard({
  to,
  title,
  description,
  comingSoon,
  continueAvailable,
  cooldownUntil,
  progress,
  completed,
  icon,
}: {
  to: string
  title: string
  description: string
  comingSoon?: boolean
  continueAvailable?: boolean
  cooldownUntil?: number | null
  progress?: number
  completed?: boolean
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

  const content = (
    <>
      {completed ? (
        <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-amber-400/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#113DCB]">
          🏆 Won
        </span>
      ) : (
        <>
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
        </>
      )}
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
        {typeof progress === 'number' && (
          <div className="absolute" style={{ inset: -(RING_SIZE - 48) / 2 }}>
            <ProgressRing progress={progress} />
          </div>
        )}
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="text-sm text-white/60">{description}</p>
      </div>
    </>
  )

  if (completed) {
    return (
      <div
        aria-disabled="true"
        title="You've already won this game — ask an admin to reset it to play again."
        className="relative flex cursor-not-allowed items-center gap-4 rounded-2xl bg-white/5 p-5 opacity-70 ring-1 ring-amber-400/30"
      >
        {content}
      </div>
    )
  }

  return (
    <Link
      to={to}
      className={`relative flex items-center gap-4 rounded-2xl p-5 transition ${
        comingSoon ? 'bg-white/5 hover:bg-white/10' : 'bg-white/10 hover:bg-white/15'
      }`}
    >
      {content}
    </Link>
  )
}
