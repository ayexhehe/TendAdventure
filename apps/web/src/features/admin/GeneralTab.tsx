import { useEffect, useState } from 'react'
import { resetAllCooldowns, resetAllPlayers } from '../../lib/quizBowlAdmin'
import { subscribeToQuizBowlSettings, setNoRepeatQuestions } from '../../lib/quizBowlSettings'
import { subscribeToTaskedSettings, saveTaskedSettings } from '../../lib/taskedSettings'

const inputClass = 'rounded-md bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40'
const labelClass = 'text-xs font-medium text-white/50'

type ActionKey = 'cooldown' | 'players'

export function GeneralTab() {
  const [confirming, setConfirming] = useState<ActionKey | null>(null)
  const [running, setRunning] = useState<ActionKey | null>(null)
  const [result, setResult] = useState<Record<ActionKey, string | null>>({
    cooldown: null,
    players: null,
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

  const [inviteLink, setInviteLink] = useState('')
  const [task2Hashtags, setTask2Hashtags] = useState('')
  const [taskedLoaded, setTaskedLoaded] = useState(false)
  const [savingTasked, setSavingTasked] = useState(false)
  const [taskedSaved, setTaskedSaved] = useState(false)

  useEffect(
    () =>
      subscribeToTaskedSettings((s) => {
        if (!taskedLoaded) {
          setInviteLink(s?.inviteLink ?? '')
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
      await saveTaskedSettings({ inviteLink: inviteLink.trim(), task2Hashtags: task2Hashtags.trim() })
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
            <button
              type="button"
              role="switch"
              aria-checked={noRepeat}
              onClick={() => void handleToggleNoRepeat()}
              disabled={savingToggle}
              className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50 ${
                noRepeat ? 'bg-emerald-500' : 'bg-white/15'
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition ${
                  noRepeat ? 'left-5.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white/5 p-6">
        <h2 className="text-lg font-semibold">taSKed</h2>
        <p className="mt-1 text-sm text-white/60">
          Task 1 shares a personal link with each player that redirects here once clicked — set
          where it should send friends. Task 2's hashtags are shown to players as instructions.
        </p>

        <div className="mt-5 flex flex-col gap-4 border-t border-white/10 pt-5">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Task 1 invite link (where friends land)</label>
            <input
              type="url"
              value={inviteLink}
              onChange={(e) => setInviteLink(e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
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
      </section>
    </div>
  )
}
