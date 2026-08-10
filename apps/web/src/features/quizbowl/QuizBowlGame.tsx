import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { GameSettingsDoc } from '@tindadventure/shared'
import { subscribeToMerchants, type MerchantWithId } from '../../lib/merchants'
import { getAttempt, startAttempt, advanceAttempt, QUIZ_COOLDOWN_MS } from '../../lib/quizBowlAttempts'
import { getSeenQuestions, recordSeenQuestions } from '../../lib/quizBowlSeenQuestions'
import { subscribeToQuizBowlSettings } from '../../lib/quizBowlSettings'
import { subscribeToGameSettings } from '../../lib/gameSettings'
import { recordQuizBowlWin } from '../../lib/users'
import { awardTindaCoupon, isGameSoldOut, subscribeToMyCoupons, type TindaCouponWithId } from '../../lib/tindaCoupons'
import { useAuth } from '../../hooks/useAuth'
import { ImageWithSkeleton } from '../../components/skeleton/ImageWithSkeleton'
import { SpotlightSkeleton } from '../../components/skeleton/Skeletons'
import { BackButton } from '../../components/BackButton'
import { CouponWinCelebration } from '../../components/tindaCoupons/CouponWinCelebration'
import { buildQuizRound, questionKey, type QuizRoundQuestion } from './buildQuizRound'
import { formatCooldown } from '../../lib/time'

const OPTION_LETTERS = ['A', 'B', 'C', 'D']

function ClueModal({
  question,
  open,
  onClose,
}: {
  question: QuizRoundQuestion
  open: boolean
  onClose: () => void
}) {
  return (
    <div className={open ? '' : 'hidden'}>
      <button
        type="button"
        aria-label="Close clue"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-[#0d2fa0] ring-1 ring-white/15">
          {question.merchantImageURL ? (
            <ImageWithSkeleton
              src={question.merchantImageURL}
              alt=""
              className="aspect-video w-full"
              priority={open ? 'high' : 'low'}
            />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center bg-linear-to-br from-white/15 to-white/5 text-3xl font-semibold text-white/30">
              {question.merchantName.charAt(0).toUpperCase() || '?'}
            </div>
          )}
          <div className="flex items-center justify-between gap-3 p-4">
            <div>
              {question.merchantTindaZone && (
                <p className="text-xs font-medium tracking-wide text-white/50 uppercase">
                  {question.merchantTindaZone}
                </p>
              )}
              <p className="text-base font-semibold text-white">{question.merchantName}</p>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function QuizBowlGame() {
  const { user } = useAuth()

  const [merchants, setMerchants] = useState<MerchantWithId[]>([])
  const [merchantsLoading, setMerchantsLoading] = useState(true)
  const [attemptLoading, setAttemptLoading] = useState(true)
  const attemptStarted = useRef(false)

  const [round, setRound] = useState<QuizRoundQuestion[]>([])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [status, setStatus] = useState<'intro' | 'in_progress' | 'won' | 'lost' | 'no_questions'>('intro')
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const [clueOpen, setClueOpen] = useState(false)
  const [noRepeatQuestions, setNoRepeatQuestions] = useState(false)
  const [gameSettings, setGameSettings] = useState<GameSettingsDoc | null>(null)
  const [myCoupons, setMyCoupons] = useState<TindaCouponWithId[]>([])

  useEffect(() => subscribeToGameSettings(setGameSettings), [])

  useEffect(() => {
    if (!user) return
    return subscribeToMyCoupons(user.uid, setMyCoupons)
  }, [user])

  const gameOpen = gameSettings?.quizBowlOpen ?? true
  const soldOut = isGameSoldOut('quizBowl', gameSettings, merchants)
  const hasQuizCoupon = myCoupons.some((c) => c.source === 'quizBowl')

  useEffect(
    () =>
      subscribeToMerchants((m) => {
        setMerchants(m)
        setMerchantsLoading(false)
      }),
    [],
  )

  useEffect(
    () => subscribeToQuizBowlSettings((s) => setNoRepeatQuestions(s?.noRepeatQuestions ?? false)),
    [],
  )

  const eligibleCount = merchants.filter((m) => (m.questions ?? []).length > 0).length
  const introThreshold = Math.ceil(eligibleCount / 2)

  const handleStart = async () => {
    if (!user) return
    const seen = noRepeatQuestions ? await getSeenQuestions(user.uid) : new Set<string>()
    const freshRound = buildQuizRound(merchants, seen)
    if (freshRound.length === 0) {
      setStatus('no_questions')
      return
    }
    await startAttempt(user.uid, freshRound)
    await recordSeenQuestions(
      user.uid,
      freshRound.map((q) => questionKey(q.merchantId, q.question)),
    )
    setRound(freshRound)
    setIndex(0)
    setCorrectCount(0)
    setSelected(null)
    setCooldownUntil(null)
    setStatus('in_progress')
  }

  useEffect(() => {
    if (!user || merchantsLoading || attemptStarted.current) return
    attemptStarted.current = true

    void (async () => {
      const existing = await getAttempt(user.uid)

      if (existing?.status === 'won') {
        setStatus('won')
        setAttemptLoading(false)
        return
      }

      if (existing?.status === 'lost' && existing.cooldownUntil && existing.cooldownUntil > Date.now()) {
        setRound(existing.round)
        setCorrectCount(existing.correctCount)
        setCooldownUntil(existing.cooldownUntil)
        setStatus('lost')
        setAttemptLoading(false)
        return
      }

      if (existing?.status === 'in_progress') {
        setRound(existing.round)
        setIndex(existing.index)
        setCorrectCount(existing.correctCount)
        setStatus('in_progress')
        setAttemptLoading(false)
        return
      }

      // No saved attempt, or a past cooldown has expired — show the
      // guidelines intro before starting a brand-new round.
      setStatus(merchants.some((m) => (m.questions ?? []).length > 0) ? 'intro' : 'no_questions')
      setAttemptLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, merchantsLoading])

  useEffect(() => {
    if (status !== 'lost' || !cooldownUntil) return
    const tick = () => setCooldownRemaining(cooldownUntil - Date.now())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [status, cooldownUntil])

  if (!user || merchantsLoading || attemptLoading) {
    return (
      <div className="w-full max-w-2xl">
        <SpotlightSkeleton />
      </div>
    )
  }

  if (!gameOpen) {
    return (
      <div className="flex flex-col items-center gap-3 text-center text-white">
        <p className="text-lg font-medium">Quiz Bowl is currently closed.</p>
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

  if (status === 'intro' && soldOut) {
    return (
      <div className="flex flex-col items-center gap-3 text-center text-white">
        <p className="text-lg font-medium">Quiz Bowl is out of TindaCoupons.</p>
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

  if (status === 'intro') {
    return (
      <div className="relative flex w-full max-w-lg flex-col items-center gap-5 rounded-2xl bg-white/5 p-6 text-center text-white sm:p-8">
        <BackButton className="left-3 top-3" />
        <h2 className="text-2xl font-semibold sm:text-3xl">Quiz Bowl Game!</h2>
        <div className="flex flex-col gap-2 text-sm text-white/70 sm:text-base">
          <p>
            You only need to pass {introThreshold} out of {eligibleCount} questions about our merchants.
          </p>
          <p>There's no time limit, so take your time to get to know the Tindahans.</p>
          <p>1 TindaCoupon for every win. 30-minute cooldown if you don't — while coupons last.</p>
        </div>
        <button
          type="button"
          onClick={() => void handleStart()}
          className="mt-2 rounded-full bg-white px-8 py-2.5 text-sm font-medium text-[#113DCB] hover:bg-white/90"
        >
          Start
        </button>
      </div>
    )
  }

  if (status === 'no_questions') {
    return (
      <div className="flex flex-col items-center gap-3 text-center text-white">
        <p className="text-lg font-medium">No quiz questions available yet.</p>
        <p className="text-sm text-white/60">Check back once merchants have added their questions.</p>
        <Link
          to="/games"
          className="mt-2 rounded-full bg-white px-6 py-2 text-sm font-medium text-[#113DCB] hover:bg-white/90"
        >
          View more games
        </Link>
      </div>
    )
  }

  if (status === 'won') {
    return (
      <div className="flex flex-col items-center gap-4 text-center text-white">
        {hasQuizCoupon ? (
          <>
            <p className="animate-bounce text-6xl">🎉</p>
            <div>
              <p className="text-3xl font-bold">You won a TindaCoupon!</p>
              <p className="mt-1 text-sm text-white/60">Present this at the tindahan below to claim it.</p>
            </div>
            <CouponWinCelebration source="quizBowl" coupons={myCoupons} merchants={merchants} />
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

  if (status === 'lost') {
    const ready = cooldownRemaining <= 0
    const winThreshold = Math.ceil(round.length / 2)
    return (
      <div className="flex flex-col items-center gap-3 text-center text-white">
        <p className="text-2xl font-semibold">
          {correctCount} / {round.length} correct
        </p>
        <p className="text-lg">You needed {winThreshold} correct to win — try again later.</p>
        {ready ? (
          <button
            type="button"
            onClick={() => setStatus('intro')}
            className="mt-2 rounded-full bg-white px-6 py-2 text-sm font-medium text-[#113DCB] hover:bg-white/90"
          >
            Try again
          </button>
        ) : (
          <p className="text-sm text-white/60">Next attempt available in {formatCooldown(cooldownRemaining)}</p>
        )}
        <Link to="/games" className="mt-2 text-sm text-white/60 underline">
          View more games
        </Link>
      </div>
    )
  }

  const winThreshold = Math.ceil(round.length / 2)
  const question = round[index]
  const isLast = index === round.length - 1

  const handleSelect = (option: string) => {
    if (selected) return
    setSelected(option)
    if (option === question.correctAnswer) setCorrectCount((c) => c + 1)
  }

  const handleNext = async () => {
    setClueOpen(false)

    if (isLast) {
      const won = correctCount >= winThreshold
      const now = Date.now()
      await advanceAttempt(user.uid, {
        index,
        correctCount,
        status: won ? 'won' : 'lost',
        finishedAt: now,
        cooldownUntil: won ? null : now + QUIZ_COOLDOWN_MS,
      })
      if (won) {
        await recordQuizBowlWin(user.uid)
        await awardTindaCoupon(user.uid, 'quizBowl')
        setStatus('won')
      } else {
        setCooldownUntil(now + QUIZ_COOLDOWN_MS)
        setStatus('lost')
      }
      return
    }

    const nextIndex = index + 1
    await advanceAttempt(user.uid, {
      index: nextIndex,
      correctCount,
      status: 'in_progress',
      finishedAt: null,
      cooldownUntil: null,
    })
    setIndex(nextIndex)
    setSelected(null)
  }

  return (
    <div className="w-full max-w-2xl text-white">
      <div className="relative mb-5 flex items-center justify-center">
        <span className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-white/70 uppercase">
          Question {index + 1} of {round.length}
        </span>
        <button
          type="button"
          onClick={() => setClueOpen(true)}
          className="absolute right-0 flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
        >
          💡 Show Clue
        </button>
      </div>

      <p className="mb-5 text-center text-xl font-semibold sm:text-2xl">{question.question}</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {question.options.map((option, i) => {
          const isCorrectOption = option === question.correctAnswer
          const isSelectedOption = option === selected

          let optionClass = 'bg-white/10 ring-1 ring-white/10 hover:bg-white/20'
          if (selected) {
            if (isCorrectOption) {
              optionClass = 'bg-emerald-500/30 ring-1 ring-emerald-400'
            } else if (isSelectedOption) {
              optionClass = 'bg-red-500/30 ring-1 ring-red-400'
            } else {
              optionClass = 'bg-white/5 ring-1 ring-white/5 opacity-60'
            }
          }

          return (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(option)}
              disabled={selected !== null}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left text-sm font-medium text-white transition disabled:cursor-default ${optionClass}`}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-semibold">
                {OPTION_LETTERS[i]}
              </span>
              {option}
            </button>
          )
        })}
      </div>

      {selected && (
        <div className="mt-6 flex flex-col items-start gap-3">
          <p className={selected === question.correctAnswer ? 'text-emerald-300' : 'text-red-300'}>
            {selected === question.correctAnswer
              ? 'Correct!'
              : `Incorrect — the answer was "${question.correctAnswer}".`}
          </p>
          <button
            type="button"
            onClick={() => void handleNext()}
            className="rounded-md bg-white px-6 py-2.5 text-sm font-medium text-[#113DCB] hover:bg-white/90"
          >
            {isLast ? 'See result' : 'Next question'}
          </button>
        </div>
      )}

      {round.map((q, i) => (
        <ClueModal
          key={q.merchantId}
          question={q}
          open={clueOpen && i === index}
          onClose={() => setClueOpen(false)}
        />
      ))}
    </div>
  )
}
