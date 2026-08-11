import { useState } from 'react'
import type { MerchantWithId } from '../../lib/merchants'
import { resetAllCouponCounts, resetGameCouponCount, resetMerchantCouponCount } from '../../lib/couponAdmin'

type ActionKey = 'all' | 'quizBowl' | 'tasked' | 'voting' | 'merchant'

const GAME_LABEL: Record<'quizBowl' | 'tasked' | 'voting', string> = {
  quizBowl: 'Quiz Bowl',
  tasked: 'taSKed',
  voting: 'Voting',
}

export function CouponResetSettings({ merchants }: { merchants: MerchantWithId[] }) {
  const [open, setOpen] = useState(false)
  const [selectedMerchant, setSelectedMerchant] = useState('')
  const [confirming, setConfirming] = useState<ActionKey | null>(null)
  const [running, setRunning] = useState<ActionKey | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleResetAll = async () => {
    setConfirming(null)
    setRunning('all')
    setMessage(null)
    try {
      const count = await resetAllCouponCounts()
      setMessage(`Reset counts for ${count} merchant${count === 1 ? '' : 's'} and all games.`)
    } finally {
      setRunning(null)
    }
  }

  const handleResetGame = async (source: 'quizBowl' | 'tasked' | 'voting') => {
    setConfirming(null)
    setRunning(source)
    setMessage(null)
    try {
      await resetGameCouponCount(source)
      setMessage(`Reset ${GAME_LABEL[source]}'s issued count.`)
    } finally {
      setRunning(null)
    }
  }

  const handleResetMerchant = async () => {
    if (!selectedMerchant) return
    setConfirming(null)
    setRunning('merchant')
    setMessage(null)
    try {
      await resetMerchantCouponCount(selectedMerchant)
      const name = merchants.find((m) => m.id === selectedMerchant)?.name
      setMessage(`Reset ${name ?? 'that merchant'}'s issued count.`)
    } finally {
      setRunning(null)
    }
  }

  return (
    <div className="relative ml-auto">
      <button
        type="button"
        aria-label="TindaCoupon settings"
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path
            fillRule="evenodd"
            d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.25a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.993 6.993 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
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
          <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl bg-[#0d2fa0] p-4 text-sm shadow-xl ring-1 ring-white/10">
            <p className="font-semibold text-white">Reset TindaCoupon counts</p>
            <p className="mt-1 text-xs text-white/50">
              Only clears the allocation counters below — coupons already won are never deleted or
              changed, so redemptions still work normally.
            </p>

            <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-3">
              <p className="text-xs font-medium text-white/60">All at once</p>
              {confirming === 'all' ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-white/50">Reset every count?</span>
                  <button
                    type="button"
                    onClick={() => void handleResetAll()}
                    className="rounded-full bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-400"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(null)}
                    className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming('all')}
                  disabled={running === 'all'}
                  className="self-start rounded-full bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500/30 disabled:opacity-50"
                >
                  {running === 'all' ? 'Resetting…' : 'Reset all counts'}
                </button>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-3">
              <p className="text-xs font-medium text-white/60">Per game</p>
              {confirming === 'quizBowl' || confirming === 'tasked' || confirming === 'voting' ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-white/50">Reset {GAME_LABEL[confirming]}'s count?</span>
                  <button
                    type="button"
                    onClick={() => void handleResetGame(confirming)}
                    className="rounded-full bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-400"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(null)}
                    className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirming('quizBowl')}
                    disabled={running === 'quizBowl'}
                    className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 disabled:opacity-50"
                  >
                    {running === 'quizBowl' ? 'Resetting…' : 'Quiz Bowl'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming('tasked')}
                    disabled={running === 'tasked'}
                    className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 disabled:opacity-50"
                  >
                    {running === 'tasked' ? 'Resetting…' : 'taSKed'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming('voting')}
                    disabled={running === 'voting'}
                    className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 disabled:opacity-50"
                  >
                    {running === 'voting' ? 'Resetting…' : 'Voting'}
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-3">
              <p className="text-xs font-medium text-white/60">Per merchant</p>
              {confirming === 'merchant' ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-white/50">
                    Reset {merchants.find((m) => m.id === selectedMerchant)?.name ?? 'that merchant'}'s
                    count?
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleResetMerchant()}
                    className="rounded-full bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-400"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(null)}
                    className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <select
                    value={selectedMerchant}
                    onChange={(e) => setSelectedMerchant(e.target.value)}
                    className="min-w-0 flex-1 rounded-md bg-white/10 px-2 py-1.5 text-xs text-white"
                  >
                    <option value="" className="text-black">
                      Select a merchant
                    </option>
                    {merchants.map((m) => (
                      <option key={m.id} value={m.id} className="text-black">
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setConfirming('merchant')}
                    disabled={!selectedMerchant || running === 'merchant'}
                    className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 disabled:opacity-50"
                  >
                    {running === 'merchant' ? 'Resetting…' : 'Reset'}
                  </button>
                </div>
              )}
            </div>

            {message && <p className="mt-3 text-xs text-emerald-300">{message}</p>}
          </div>
        </>
      )}
    </div>
  )
}
