import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { GameSettingsDoc, TaskedEntrantDoc, TaskedSettingsDoc } from '@tindadventure/shared'
import { useAuth } from '../../hooks/useAuth'
import { SpotlightSkeleton } from '../../components/skeleton/Skeletons'
import { BackButton } from '../../components/BackButton'
import { CouponWinCelebration } from '../../components/tindaCoupons/CouponWinCelebration'
import { submitMessage } from '../../lib/messageWall'
import { recordTaskedWin } from '../../lib/users'
import {
  awardTindaCoupon,
  isGameSoldOut,
  subscribeToMyCoupons,
  type TindaCouponWithId,
} from '../../lib/tindaCoupons'
import { subscribeToTaskedSettings } from '../../lib/taskedSettings'
import { subscribeToGameSettings } from '../../lib/gameSettings'
import { subscribeToMerchants, type MerchantWithId } from '../../lib/merchants'
import {
  TASKED_TASK1_TARGET,
  completeAllTasksIfReady,
  completeTask1IfReady,
  ensureEntrant,
  isFacebookLink,
  submitTask2,
  submitTask3,
  subscribeToClickCount,
  subscribeToEntrant,
} from '../../lib/tasked'

const inputClass = 'rounded-md bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40'

// Invite links are meant to be opened by someone else's phone, so they must
// always point at the live site regardless of what origin generated them —
// including in dev, where a localhost link would be useless to the recipient.
const SITE_ORIGIN = 'https://tend-adventure-web.vercel.app'

function TaskCard({
  step,
  title,
  completed,
  children,
}: {
  step: number
  title: string
  completed: boolean
  children: ReactNode
}) {
  return (
    <section
      className={`rounded-2xl p-5 ring-1 transition ${
        completed ? 'bg-emerald-500/10 ring-emerald-400/30' : 'bg-white/5 ring-white/10'
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
            completed ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/70'
          }`}
        >
          {completed ? '✓' : step}
        </span>
        <h3 className="text-base font-semibold text-white">{title}</h3>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

export function TaskedGame() {
  const { user, userDoc } = useAuth()

  const [entrant, setEntrant] = useState<TaskedEntrantDoc | null>(null)
  const [entrantLoading, setEntrantLoading] = useState(true)
  const [clickCount, setClickCount] = useState(0)
  const [settings, setSettings] = useState<TaskedSettingsDoc | null>(null)
  const ensured = useRef(false)
  const completingTask1 = useRef(false)
  const awarding = useRef(false)

  const [copied, setCopied] = useState(false)
  const [task2Input, setTask2Input] = useState('')
  const [task2Error, setTask2Error] = useState<string | null>(null)
  const [task2Submitting, setTask2Submitting] = useState(false)
  const [task3Text, setTask3Text] = useState('')
  const [task3Error, setTask3Error] = useState<string | null>(null)
  const [task3Submitting, setTask3Submitting] = useState(false)
  const [gameSettings, setGameSettings] = useState<GameSettingsDoc | null>(null)
  const [merchants, setMerchants] = useState<MerchantWithId[]>([])
  const [myCoupons, setMyCoupons] = useState<TindaCouponWithId[]>([])

  useEffect(() => subscribeToGameSettings(setGameSettings), [])
  useEffect(() => subscribeToMerchants(setMerchants), [])

  useEffect(() => {
    if (!user) return
    return subscribeToMyCoupons(user.uid, setMyCoupons)
  }, [user])

  const gameOpen = gameSettings?.taskedOpen ?? true
  const soldOut = isGameSoldOut('tasked', gameSettings, merchants)
  const hasTaskedCoupon = myCoupons.some((c) => c.source === 'tasked')

  useEffect(() => {
    if (!user) return
    let cancelled = false
    let unsubscribe: (() => void) | null = null

    void (async () => {
      if (!ensured.current) {
        ensured.current = true
        const displayName = userDoc?.displayName || user.displayName || 'A friend'
        await ensureEntrant(user.uid, displayName)
      }
      if (cancelled) return
      unsubscribe = subscribeToEntrant(user.uid, (e) => {
        setEntrant(e)
        setEntrantLoading(false)
      })
    })()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
    // displayName is only read once, guarded by ensured.current — it
    // shouldn't re-run this effect if the profile changes later.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    if (!user) return
    return subscribeToClickCount(user.uid, setClickCount)
  }, [user])

  useEffect(() => subscribeToTaskedSettings(setSettings), [])

  useEffect(() => {
    if (!user || !entrant || entrant.task1CompletedAt) return
    if (clickCount < TASKED_TASK1_TARGET || completingTask1.current) return
    completingTask1.current = true
    void completeTask1IfReady(user.uid, clickCount).finally(() => {
      completingTask1.current = false
    })
  }, [user, entrant, clickCount])

  const allDone = !!(entrant?.task1CompletedAt && entrant?.task2CompletedAt && entrant?.task3CompletedAt)

  useEffect(() => {
    if (!user || !entrant || !allDone || entrant.allTasksCompletedAt || awarding.current) return
    awarding.current = true
    void (async () => {
      await completeAllTasksIfReady(user.uid, entrant)
      await recordTaskedWin(user.uid).catch(() => {})
      await awardTindaCoupon(user.uid, 'tasked').catch(() => {})
    })()
  }, [user, entrant, allDone])

  if (!user || entrantLoading || !entrant) {
    return (
      <div className="w-full max-w-2xl">
        <SpotlightSkeleton />
      </div>
    )
  }

  if (!gameOpen) {
    return (
      <div className="flex flex-col items-center gap-3 text-center text-white">
        <p className="text-lg font-medium">taSKed is currently closed.</p>
        <p className="text-sm text-white/60">Check back later — the admin has temporarily paused this game.</p>
        <Link
          to="/games"
          className="mt-2 rounded-full bg-white px-6 py-2 text-sm font-medium text-[#113DCB] hover:bg-white/90"
        >
          View more games
        </Link>
      </div>
    )
  }

  const hasStarted = !!(entrant.task1CompletedAt || entrant.task2CompletedAt || entrant.task3CompletedAt)

  if (!hasStarted && !entrant.allTasksCompletedAt && soldOut) {
    return (
      <div className="flex flex-col items-center gap-3 text-center text-white">
        <p className="text-lg font-medium">taSKed is out of TindaCoupons.</p>
        <p className="text-sm text-white/60">
          All prizes for this game have been claimed — check back if more become available.
        </p>
        <Link
          to="/games"
          className="mt-2 rounded-full bg-white px-6 py-2 text-sm font-medium text-[#113DCB] hover:bg-white/90"
        >
          View more games
        </Link>
      </div>
    )
  }

  if (entrant.allTasksCompletedAt) {
    return (
      <div className="flex flex-col items-center gap-4 text-center text-white">
        {hasTaskedCoupon ? (
          <>
            <p className="animate-bounce text-6xl">🎉</p>
            <div>
              <p className="text-3xl font-bold">You completed taSKed!</p>
              <p className="mt-1 text-sm text-white/60">Present this at the tindahan below to claim it.</p>
            </div>
            <CouponWinCelebration source="tasked" coupons={myCoupons} merchants={merchants} />
          </>
        ) : (
          <>
            <p className="text-2xl font-semibold">😔 You ran out of TindaCoupon.</p>
            <p className="text-sm text-white/60">Better luck next time!</p>
          </>
        )}
        <Link
          to="/games"
          className="mt-1 rounded-full bg-white/10 px-6 py-2 text-sm font-medium text-white hover:bg-white/20"
        >
          View more games
        </Link>
      </div>
    )
  }

  const shareLink = `${SITE_ORIGIN}/i/${entrant.personalShareSlug}`
  const shareText = [
    '🎉 FROM ONE YOUTH TO ANOTHER — GUADAHIUSA NA! 💙',
    '',
    'Kauban ang SK Guadalupe Council sa pag-celebrate sa Linggo ng Kabataan 2026! ✨',
    '',
    'Naay games 🎮, youth stalls 🛍️, TindaCoupon prizes 🎟️, ug live music 🎶 from our young local talents! 🎤🔥',
    '',
    'Bangon na, og kaligo na dira! 😂',
    'Kuyog ta, magka-kita kita ta diri! 🤙💙',
    '',
    '🎶 GUADAHIUSA — Youth Arts and Music Festival 2026',
  ].join('\n')
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (canNativeShare) {
      try {
        await navigator.share({ title: 'SK Guadalupe – Linggo ng Kabataan', text: shareText, url: shareLink })
      } catch {
        // user backed out of the share sheet — nothing to do
      }
      return
    }
    // No Web Share API (rare on mobile nowadays, e.g. some in-app
    // webviews): try Messenger's own deep link. It's a no-op on desktop
    // or if Messenger isn't installed — Copy link is the safety net.
    window.location.href = `fb-messenger://share/?link=${encodeURIComponent(shareLink)}`
  }

  const handleTask2Submit = async () => {
    if (!user) return
    setTask2Error(null)
    const link = task2Input.trim()
    if (!link) {
      setTask2Error('Paste your Facebook post link.')
      return
    }
    if (!isFacebookLink(link)) {
      setTask2Error("That doesn't look like a Facebook link.")
      return
    }
    setTask2Submitting(true)
    try {
      await submitTask2(user.uid, link)
    } finally {
      setTask2Submitting(false)
    }
  }

  const handleTask3Submit = async () => {
    if (!user) return
    setTask3Error(null)
    const text = task3Text.trim()
    if (!text) {
      setTask3Error('Write a message first.')
      return
    }
    setTask3Submitting(true)
    try {
      const displayName = userDoc?.displayName || user.displayName || 'Anonymous'
      const messageId = await submitMessage(user.uid, displayName, text)
      await submitTask3(user.uid, messageId)
    } catch {
      setTask3Error('Something went wrong — try again.')
    } finally {
      setTask3Submitting(false)
    }
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-5 text-white">
      <div className="relative text-center">
        <BackButton />
        <h1 className="text-2xl font-semibold sm:text-3xl">You are TaSKed!</h1>
        <p className="mt-2 text-sm text-white/60">Complete all 3 tasks below to win a TindaCoupon.</p>
      </div>

      <TaskCard
        step={1}
        title="Invite 3 of your friends to celebrate Linggo ng Kabataan with you!"
        completed={!!entrant.task1CompletedAt}
      >
        <p className="text-sm text-white/60">
          Send your personal link to friends — Messenger works great. Once 3 of them open it, this
          task is done.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleShare()}
            className="flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[#113DCB] hover:bg-white/90"
          >
            📩 {canNativeShare ? 'Share with a friend' : 'Send via Messenger'}
          </button>
          <button
            type="button"
            onClick={() => void handleCopyLink()}
            className="shrink-0 rounded-full bg-white/10 px-4 py-2.5 text-xs font-medium text-white hover:bg-white/20"
          >
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
        <code className="mt-2 block truncate rounded-md bg-white/10 px-3 py-2 text-xs text-white/60">
          {shareLink}
        </code>
        <p className="mt-3 text-xs text-white/50">
          {Math.min(clickCount, TASKED_TASK1_TARGET)} / {TASKED_TASK1_TARGET} friends invited
        </p>
      </TaskCard>

      <TaskCard
        step={2}
        title="Post best part of GUADAHIUSA: Youth Arts and Music Festival 2026"
        completed={!!entrant.task2CompletedAt}
      >
        <p className="text-sm text-white/60">
          Post it on Facebook using {settings?.task2Hashtags || 'the event hashtags'}, then paste your post link
          below.
        </p>
        {entrant.task2CompletedAt ? (
          <p className="mt-3 truncate text-xs text-emerald-300">Submitted: {entrant.task2PostLink}</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="url"
              value={task2Input}
              onChange={(e) => setTask2Input(e.target.value)}
              placeholder="https://facebook.com/..."
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              onClick={() => void handleTask2Submit()}
              disabled={task2Submitting}
              className="shrink-0 rounded-full bg-white px-4 py-2 text-xs font-medium text-[#113DCB] hover:bg-white/90 disabled:opacity-50"
            >
              {task2Submitting ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        )}
        {task2Error && <p className="mt-2 text-xs text-red-300">{task2Error}</p>}
      </TaskCard>

      <TaskCard step={3} title="Message to the youth!" completed={!!entrant.task3CompletedAt}>
        <p className="text-sm text-white/60">
          Leave a message for the youth of Barangay Guadalupe — it'll appear on our{' '}
          <Link to="/wall" className="underline">
            Message Wall
          </Link>{' '}
          once approved.
        </p>
        {entrant.task3CompletedAt ? (
          <p className="mt-3 text-xs text-emerald-300">Message submitted — thank you!</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            <textarea
              value={task3Text}
              onChange={(e) => setTask3Text(e.target.value)}
              rows={3}
              placeholder="Write your message..."
              className={`${inputClass} resize-none`}
            />
            <button
              type="button"
              onClick={() => void handleTask3Submit()}
              disabled={task3Submitting}
              className="self-start rounded-full bg-white px-4 py-2 text-xs font-medium text-[#113DCB] hover:bg-white/90 disabled:opacity-50"
            >
              {task3Submitting ? 'Submitting…' : 'Submit message'}
            </button>
          </div>
        )}
        {task3Error && <p className="mt-2 text-xs text-red-300">{task3Error}</p>}
      </TaskCard>
    </div>
  )
}
