import { useEffect, useState } from 'react'
import { resetAllCooldowns, resetAllPlayers } from '../../lib/quizBowlAdmin'
import { resetAllTaskedPlayers } from '../../lib/taskedAdmin'
import { subscribeToQuizBowlSettings, setNoRepeatQuestions } from '../../lib/quizBowlSettings'
import {
  subscribeToTaskedSettings,
  saveTaskedSettings,
  DEFAULT_TASK1_SHARE_MESSAGE,
} from '../../lib/taskedSettings'
import { subscribeToGameSettings, saveGameSettings } from '../../lib/gameSettings'
import { subscribeToMerchants } from '../../lib/merchants'

const inputClass = 'rounded-md bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40'
const labelClass = 'text-xs font-medium text-white/50'

function Switch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50 ${
        checked ? 'bg-emerald-500' : 'bg-white/15'
      }`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition ${
          checked ? 'left-5.5' : 'left-0.5'
        }`}
      />
    </button>
  )
}

type ActionKey = 'cooldown' | 'players' | 'tasked'

export function GeneralTab() {
  const [confirming, setConfirming] = useState<ActionKey | null>(null)
  const [running, setRunning] = useState<ActionKey | null>(null)
  const [result, setResult] = useState<Record<ActionKey, string | null>>({
    cooldown: null,
    players: null,
    tasked: null,
  })
  const [noRepeat, setNoRepeat] = useState(false)
  const [savingToggle, setSavingToggle] = useState(false)

  useEffect(() => subscribeToQuizBowlSettings((s) => setNoRepeat(s?.noRepeatQuestions ?? false)), [])

  const handleToggleNoRepeat = async () => {
    const next = !noRepeat
    setSavingToggle(true)
    setNoRepeat(next)
    try {
      await setNoRepeatQuestions(next)
    } finally {
      setSavingToggle(false)
    }
  }

  const [gameSettingsLoaded, setGameSettingsLoaded] = useState(false)
  const [quizBowlOpen, setQuizBowlOpen] = useState(true)
  const [savingQuizOpen, setSavingQuizOpen] = useState(false)
  const [quizBowlTicketsTotal, setQuizBowlTicketsTotal] = useState('0')
  const [savingQuizTickets, setSavingQuizTickets] = useState(false)
  const [quizTicketsSaved, setQuizTicketsSaved] = useState(false)
  const [taskedOpen, setTaskedOpen] = useState(true)
  const [savingTaskedOpen, setSavingTaskedOpen] = useState(false)
  const [taskedTicketsTotal, setTaskedTicketsTotal] = useState('0')
  const [savingTaskedTickets, setSavingTaskedTickets] = useState(false)
  const [taskedTicketsSaved, setTaskedTicketsSaved] = useState(false)
  const [quizTicketsError, setQuizTicketsError] = useState<string | null>(null)
  const [taskedTicketsError, setTaskedTicketsError] = useState<string | null>(null)
  const [merchantCouponSupply, setMerchantCouponSupply] = useState(0)
  const [votingTicketsTotalForCap, setVotingTicketsTotalForCap] = useState(0)

  useEffect(
    () =>
      subscribeToMerchants((merchants) => {
        setMerchantCouponSupply(merchants.reduce((sum, m) => sum + (m.couponSupply ?? 0), 0))
      }),
    [],
  )

  // Kept live (unlike the fields below, which only sync once on load so a
  // stray snapshot doesn't clobber an admin's in-progress edit) — this one
  // has no editable input of its own, it's read-only validation input for
  // the quiz/tasked cap checks, so staying fresh is strictly better: an
  // admin editing Voting's allocation in another tab won't leave this tab's
  // cross-check working off a stale number.
  useEffect(
    () => subscribeToGameSettings((s) => setVotingTicketsTotalForCap(s?.votingTicketsTotal ?? 0)),
    [],
  )

  useEffect(
    () =>
      subscribeToGameSettings((s) => {
        if (!gameSettingsLoaded) {
          setQuizBowlOpen(s?.quizBowlOpen ?? true)
          setTaskedOpen(s?.taskedOpen ?? true)
          setQuizBowlTicketsTotal(String(s?.quizBowlTicketsTotal ?? 0))
          setTaskedTicketsTotal(String(s?.taskedTicketsTotal ?? 0))
          setGameSettingsLoaded(true)

          // First time this doc is ever touched: make sure the public
          // issued-ticket counters exist as real numbers, not just
          // missing fields — the coupon-award transaction's rules-based
          // increment requires a real number to add 1 to.
          if (!s) {
            void saveGameSettings({
              quizBowlOpen: true,
              taskedOpen: true,
              quizBowlTicketsTotal: 0,
              quizBowlTicketsIssued: 0,
              taskedTicketsTotal: 0,
              taskedTicketsIssued: 0,
              merchantSlotsTotal: 0,
              votingWindowMinutes: 10,
              votingWindowEndsAt: null,
              votingTicketsTotal: 0,
              votingTicketsIssued: 0,
              nextVotingDropAt: null,
            })
          }
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const handleToggleQuizBowlOpen = async () => {
    const next = !quizBowlOpen
    setSavingQuizOpen(true)
    setQuizBowlOpen(next)
    try {
      await saveGameSettings({ quizBowlOpen: next })
    } finally {
      setSavingQuizOpen(false)
    }
  }

  const handleToggleTaskedOpen = async () => {
    const next = !taskedOpen
    setSavingTaskedOpen(true)
    setTaskedOpen(next)
    try {
      await saveGameSettings({ taskedOpen: next })
    } finally {
      setSavingTaskedOpen(false)
    }
  }

  const handleSaveQuizTickets = async () => {
    setQuizTicketsError(null)
    setQuizTicketsSaved(false)
    const next = Math.max(0, Number(quizBowlTicketsTotal) || 0)
    const other = Math.max(0, Number(taskedTicketsTotal) || 0) + votingTicketsTotalForCap
    if (next > 0 && next + other > merchantCouponSupply) {
      setQuizTicketsError(
        `Quiz Bowl (${next}) + taSKed + Voting (${other}) = ${next + other}, which is more than the ${merchantCouponSupply} coupons allocated across merchants.`,
      )
      return
    }
    setSavingQuizTickets(true)
    try {
      await saveGameSettings({ quizBowlTicketsTotal: next })
      setQuizTicketsSaved(true)
    } finally {
      setSavingQuizTickets(false)
    }
  }

  const handleSaveTaskedTickets = async () => {
    setTaskedTicketsError(null)
    setTaskedTicketsSaved(false)
    const next = Math.max(0, Number(taskedTicketsTotal) || 0)
    const other = Math.max(0, Number(quizBowlTicketsTotal) || 0) + votingTicketsTotalForCap
    if (next > 0 && next + other > merchantCouponSupply) {
      setTaskedTicketsError(
        `taSKed (${next}) + Quiz Bowl + Voting (${other}) = ${next + other}, which is more than the ${merchantCouponSupply} coupons allocated across merchants.`,
      )
      return
    }
    setSavingTaskedTickets(true)
    try {
      await saveGameSettings({ taskedTicketsTotal: next })
      setTaskedTicketsSaved(true)
    } finally {
      setSavingTaskedTickets(false)
    }
  }

  const [task1ShareMessage, setTask1ShareMessage] = useState('')
  const [task2Hashtags, setTask2Hashtags] = useState('')
  const [taskedLoaded, setTaskedLoaded] = useState(false)
  const [savingTasked, setSavingTasked] = useState(false)
  const [taskedSaved, setTaskedSaved] = useState(false)

  useEffect(
    () =>
      subscribeToTaskedSettings((s) => {
        if (!taskedLoaded) {
          setTask1ShareMessage(s?.task1ShareMessage ?? DEFAULT_TASK1_SHARE_MESSAGE)
          setTask2Hashtags(s?.task2Hashtags ?? '')
          setTaskedLoaded(true)
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const handleSaveTasked = async () => {
    setSavingTasked(true)
    setTaskedSaved(false)
    try {
      await saveTaskedSettings({
        task1ShareMessage: task1ShareMessage.trim(),
        task2Hashtags: task2Hashtags.trim(),
      })
      setTaskedSaved(true)
    } finally {
      setSavingTasked(false)
    }
  }

  const handleResetCooldowns = async () => {
    setConfirming(null)
    setRunning('cooldown')
    setResult((r) => ({ ...r, cooldown: null }))
    try {
      const count = await resetAllCooldowns()
      setResult((r) => ({ ...r, cooldown: `Cleared cooldown for ${count} player${count === 1 ? '' : 's'}.` }))
    } finally {
      setRunning(null)
    }
  }

  const handleResetPlayers = async () => {
    setConfirming(null)
    setRunning('players')
    setResult((r) => ({ ...r, players: null }))
    try {
      const count = await resetAllPlayers()
      setResult((r) => ({ ...r, players: `Reset ${count} player attempt${count === 1 ? '' : 's'}. Everyone can play again.` }))
    } finally {
      setRunning(null)
    }
  }

  const handleResetTasked = async () => {
    setConfirming(null)
    setRunning('tasked')
    setResult((r) => ({ ...r, tasked: null }))
    try {
      const count = await resetAllTaskedPlayers()
      setResult((r) => ({ ...r, tasked: `Reset ${count} player${count === 1 ? '' : 's'}. Everyone can play again.` }))
    } finally {
      setRunning(null)
    }
  }

  return (
    <div className="flex w-full flex-col gap-6 text-white">
      <section className="rounded-2xl bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Quiz Bowl</h2>
        <p className="mt-1 text-sm text-white/60">
          These controls only affect Quiz Bowl. Once a player wins, they're normally locked out of
          playing again — use these tools to override that.
        </p>

        <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Game open</p>
              <p className="text-xs text-white/50">When off, players can't start or continue Quiz Bowl.</p>
            </div>
            <Switch
              checked={quizBowlOpen}
              onChange={() => void handleToggleQuizBowlOpen()}
              disabled={savingQuizOpen}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>TindaCoupon allocation</label>
              <input
                type="number"
                min={0}
                value={quizBowlTicketsTotal}
                onChange={(e) => setQuizBowlTicketsTotal(e.target.value)}
                placeholder="0"
                className={`${inputClass} w-32`}
              />
              <p className="text-xs text-white/40">
                Total coupons Quiz Bowl can ever hand out. 0 = unlimited (per-merchant supply still
                applies). Combined with taSKed's allocation, can't exceed{' '}
                {merchantCouponSupply} (the total across all merchants).
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void handleSaveQuizTickets()}
                disabled={savingQuizTickets}
                className="rounded-full bg-white px-5 py-2 text-xs font-medium text-[#113DCB] hover:bg-white/90 disabled:opacity-50"
              >
                {savingQuizTickets ? 'Saving…' : 'Save'}
              </button>
              {quizTicketsSaved && <span className="text-xs text-emerald-300">Saved.</span>}
            </div>
          </div>
          {quizTicketsError && <p className="text-xs text-red-300">{quizTicketsError}</p>}
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Reset cooldowns</p>
              <p className="text-xs text-white/50">
                Clears the 30-minute wait for every player currently in cooldown after a loss.
                In-progress and already-won attempts are untouched.
              </p>
            </div>
            {confirming === 'cooldown' ? (
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-white/50">Reset all cooldowns?</span>
                <button
                  type="button"
                  onClick={() => void handleResetCooldowns()}
                  className="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-400"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(null)}
                  className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming('cooldown')}
                disabled={running === 'cooldown'}
                className="shrink-0 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white hover:bg-white/20 disabled:opacity-50"
              >
                {running === 'cooldown' ? 'Resetting…' : 'Reset cooldowns'}
              </button>
            )}
          </div>
          {result.cooldown && <p className="text-xs text-emerald-300">{result.cooldown}</p>}
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Reset all players</p>
              <p className="text-xs text-white/50">
                Wipes every player's Quiz Bowl progress and win status — including players who
                already won. Everyone starts a fresh round from scratch next time they play.
              </p>
            </div>
            {confirming === 'players' ? (
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-white/50">This affects all players. Continue?</span>
                <button
                  type="button"
                  onClick={() => void handleResetPlayers()}
                  className="rounded-full bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-400"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(null)}
                  className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming('players')}
                disabled={running === 'players'}
                className="shrink-0 rounded-full bg-red-500/20 px-4 py-2 text-xs font-medium text-red-200 hover:bg-red-500/30 disabled:opacity-50"
              >
                {running === 'players' ? 'Resetting…' : 'Reset all players'}
              </button>
            )}
          </div>
          {result.players && <p className="text-xs text-emerald-300">{result.players}</p>}
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Don't repeat questions</p>
              <p className="text-xs text-white/50">
                When on, a merchant with more than one question won't ask a player the same one
                twice across retries. If every question for a merchant has already been asked, a
                repeat is unavoidable.
              </p>
            </div>
            <Switch checked={noRepeat} onChange={() => void handleToggleNoRepeat()} disabled={savingToggle} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white/5 p-6">
        <h2 className="text-lg font-semibold">taSKed</h2>
        <p className="mt-1 text-sm text-white/60">
          Task 1 shares a personal link with each player that opens our own invite page instantly
          — no redirect. Task 2's hashtags are shown to players as instructions.
        </p>

        <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Game open</p>
              <p className="text-xs text-white/50">When off, players can't start or continue taSKed.</p>
            </div>
            <Switch
              checked={taskedOpen}
              onChange={() => void handleToggleTaskedOpen()}
              disabled={savingTaskedOpen}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>TindaCoupon allocation</label>
              <input
                type="number"
                min={0}
                value={taskedTicketsTotal}
                onChange={(e) => setTaskedTicketsTotal(e.target.value)}
                placeholder="0"
                className={`${inputClass} w-32`}
              />
              <p className="text-xs text-white/40">
                Total coupons taSKed can ever hand out. 0 = unlimited (per-merchant supply still
                applies). Combined with Quiz Bowl's allocation, can't exceed {merchantCouponSupply}{' '}
                (the total across all merchants).
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void handleSaveTaskedTickets()}
                disabled={savingTaskedTickets}
                className="rounded-full bg-white px-5 py-2 text-xs font-medium text-[#113DCB] hover:bg-white/90 disabled:opacity-50"
              >
                {savingTaskedTickets ? 'Saving…' : 'Save'}
              </button>
              {taskedTicketsSaved && <span className="text-xs text-emerald-300">Saved.</span>}
            </div>
          </div>
          {taskedTicketsError && <p className="text-xs text-red-300">{taskedTicketsError}</p>}
        </div>

        <div className="mt-5 flex flex-col gap-4 border-t border-white/10 pt-5">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Task 1 share message</label>
            <textarea
              value={task1ShareMessage}
              onChange={(e) => setTask1ShareMessage(e.target.value)}
              placeholder={DEFAULT_TASK1_SHARE_MESSAGE}
              rows={6}
              className={`${inputClass} resize-y font-mono`}
            />
            <p className="text-xs text-white/40">
              What gets shared when a player taps "Share with a friend" or "Send via Messenger" on
              Task 1. Their personal invite link is appended automatically — don't include it here.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Task 2 hashtags</label>
            <input
              type="text"
              value={task2Hashtags}
              onChange={(e) => setTask2Hashtags(e.target.value)}
              placeholder="#GuadaHiUsa2026 #LinggoNgKabataan"
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void handleSaveTasked()}
              disabled={savingTasked}
              className="self-start rounded-full bg-white px-5 py-2 text-xs font-medium text-[#113DCB] hover:bg-white/90 disabled:opacity-50"
            >
              {savingTasked ? 'Saving…' : 'Save'}
            </button>
            {taskedSaved && <span className="text-xs text-emerald-300">Saved.</span>}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Reset all tasks</p>
              <p className="text-xs text-white/50">
                Wipes every player's taSKed progress and win status — including players who
                already won. Personal share links keep working; everyone starts all 3 tasks over.
              </p>
            </div>
            {confirming === 'tasked' ? (
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-white/50">This affects all players. Continue?</span>
                <button
                  type="button"
                  onClick={() => void handleResetTasked()}
                  className="rounded-full bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-400"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(null)}
                  className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming('tasked')}
                disabled={running === 'tasked'}
                className="shrink-0 rounded-full bg-red-500/20 px-4 py-2 text-xs font-medium text-red-200 hover:bg-red-500/30 disabled:opacity-50"
              >
                {running === 'tasked' ? 'Resetting…' : 'Reset all tasks'}
              </button>
            )}
          </div>
          {result.tasked && <p className="text-xs text-emerald-300">{result.tasked}</p>}
        </div>
      </section>
    </div>
  )
}
