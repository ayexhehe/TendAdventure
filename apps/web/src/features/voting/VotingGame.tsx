import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { GameSettingsDoc, VoteDoc } from '@tindadventure/shared'
import { useAuth } from '../../hooks/useAuth'
import { SpotlightSkeleton } from '../../components/skeleton/Skeletons'
import { CouponWinCelebration } from '../../components/tindaCoupons/CouponWinCelebration'
import { subscribeToGameSettings } from '../../lib/gameSettings'
import { subscribeToMyCoupons, type TindaCouponWithId } from '../../lib/tindaCoupons'
import { subscribeToMerchants, type MerchantWithId } from '../../lib/merchants'
import {
  castVote,
  subscribeToMyVotes,
  subscribeToVotingCategories,
  subscribeToVotingPerformers,
  type VotingCategoryWithId,
  type VotingPerformerWithId,
} from '../../lib/voting'
import { formatCooldown } from '../../lib/time'

function PerformerOption({
  performer,
  selected,
  onSelect,
}: {
  performer: VotingPerformerWithId
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col items-center gap-2 rounded-xl p-4 text-center transition ${
        selected ? 'bg-white/15 ring-2 ring-amber-300' : 'bg-white/5 ring-1 ring-white/10 hover:bg-white/10'
      }`}
    >
      {performer.photoURL ? (
        <img src={performer.photoURL} alt="" className="h-16 w-16 rounded-full object-cover" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-white/15 to-white/5 text-xl font-semibold text-white/30">
          {performer.name.charAt(0).toUpperCase() || '?'}
        </div>
      )}
      <span className="text-sm font-medium text-white">{performer.name}</span>
      {performer.description && (
        <span className="line-clamp-2 text-xs text-white/50">{performer.description}</span>
      )}
    </button>
  )
}

export function VotingGame() {
  const { user } = useAuth()

  const [gameSettings, setGameSettings] = useState<GameSettingsDoc | null>(null)
  const [gameSettingsLoaded, setGameSettingsLoaded] = useState(false)
  const [categories, setCategories] = useState<VotingCategoryWithId[]>([])
  const [performers, setPerformers] = useState<VotingPerformerWithId[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)
  const [myVotes, setMyVotes] = useState<VoteDoc[]>([])
  const [myCoupons, setMyCoupons] = useState<TindaCouponWithId[]>([])
  const [merchants, setMerchants] = useState<MerchantWithId[]>([])

  const [now, setNow] = useState(() => Date.now())
  const [selectedPerformerId, setSelectedPerformerId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(
    () =>
      subscribeToGameSettings((s) => {
        setGameSettings(s)
        setGameSettingsLoaded(true)
      }),
    [],
  )

  useEffect(
    () =>
      subscribeToVotingCategories((c) => {
        setCategories(c)
        setDataLoaded(true)
      }),
    [],
  )
  useEffect(() => subscribeToVotingPerformers(setPerformers), [])

  useEffect(() => {
    if (!user) return
    return subscribeToMyVotes(user.uid, setMyVotes)
  }, [user])

  useEffect(() => {
    if (!user) return
    return subscribeToMyCoupons(user.uid, setMyCoupons)
  }, [user])

  useEffect(() => subscribeToMerchants(setMerchants), [])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // Hidden categories stay manageable in the admin panel but never reach
  // voters — same for a category nobody's added performers to yet.
  const activeCategories = useMemo(
    () => categories.filter((c) => !c.hidden && performers.some((p) => p.categoryId === c.id)),
    [categories, performers],
  )
  // A just-cast vote is marked locally the instant it succeeds — closing
  // the brief gap before the Firestore listener below catches up, so a
  // double-tap or a slow connection can never present the same category
  // twice. The deterministic `${uid}_${categoryId}` doc id is the real,
  // server-enforced guarantee; this is just belt-and-suspenders for the UI.
  const [optimisticVotedIds, setOptimisticVotedIds] = useState<Set<string>>(new Set())
  const votedCategoryIds = useMemo(() => {
    const ids = new Set(myVotes.map((v) => v.categoryId))
    for (const id of optimisticVotedIds) ids.add(id)
    return ids
  }, [myVotes, optimisticVotedIds])
  const nextCategory = activeCategories.find((c) => !votedCategoryIds.has(c.id))
  const allVoted = activeCategories.length > 0 && !nextCategory
  const hasVotingCoupon = myCoupons.some((c) => c.source === 'voting')

  const windowEndsAt = gameSettings?.votingWindowEndsAt ?? null
  const windowLive = windowEndsAt != null && now < windowEndsAt
  const remainingMs = windowEndsAt != null ? windowEndsAt - now : 0

  if (!user || !gameSettingsLoaded || !dataLoaded) {
    return (
      <div className="w-full max-w-2xl">
        <SpotlightSkeleton />
      </div>
    )
  }

  if (allVoted) {
    return (
      <div className="flex flex-col items-center gap-4 text-center text-white">
        {hasVotingCoupon ? (
          <>
            <p className="animate-bounce text-6xl">🎉</p>
            <div>
              <p className="text-3xl font-bold">Congratulations!</p>
              <p className="mt-1 text-sm text-white/60">
                You won a TindaCoupon from Voting — present this at the tindahan below to claim it.
              </p>
            </div>
            <CouponWinCelebration source="voting" coupons={myCoupons} merchants={merchants} />
          </>
        ) : windowLive ? (
          <>
            <p className="text-5xl">🗳️</p>
            <div>
              <p className="text-2xl font-semibold">Thanks for voting!</p>
              <p className="mt-1 text-sm text-white/60">
                Your votes are locked in. TindaCoupons drop randomly at some point before this
                round ends — not everyone wins, and nobody wins twice. Stay on this page and
                we'll show you right away if you win!
              </p>
            </div>
          </>
        ) : (
          <>
            <p className="text-5xl">🗳️</p>
            <div>
              <p className="text-2xl font-semibold">Better luck next time!</p>
              <p className="mt-1 text-sm text-white/60">
                This round's TindaCoupon drops are done and you weren't picked this time — thanks
                for voting! Watch for the next live round.
              </p>
            </div>
          </>
        )}
        <Link
          to="/games"
          className="mt-1 rounded-full bg-white px-6 py-2 text-sm font-medium text-[#113DCB] hover:bg-white/90"
        >
          View more games
        </Link>
      </div>
    )
  }

  if (!windowLive) {
    return (
      <div className="flex flex-col items-center gap-3 text-center text-white">
        <p className="text-lg font-medium">Voting isn't live right now.</p>
        <p className="text-sm text-white/60">
          Voting only opens during a live round — check back once one's announced!
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

  if (activeCategories.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 text-center text-white">
        <p className="text-lg font-medium">No categories to vote on yet.</p>
        <p className="text-sm text-white/60">Check back once performers have been added.</p>
        <Link
          to="/games"
          className="mt-2 rounded-full bg-white px-6 py-2 text-sm font-medium text-[#113DCB] hover:bg-white/90"
        >
          View more games
        </Link>
      </div>
    )
  }

  if (!nextCategory) return null

  const categoryPerformers = performers.filter((p) => p.categoryId === nextCategory.id)

  const handleVote = async () => {
    if (!selectedPerformerId) return
    setSubmitting(true)
    setError(null)
    try {
      await castVote(user.uid, nextCategory.id, selectedPerformerId)
      setOptimisticVotedIds((prev) => new Set(prev).add(nextCategory.id))
      setSelectedPerformerId(null)
    } catch {
      setError('Could not cast that vote — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-5 text-white">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/60">
          Category {votedCategoryIds.size + 1} of {activeCategories.length}
        </p>
        <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-200">
          🔴 {formatCooldown(remainingMs)}
        </span>
      </div>

      <h2 className="text-xl font-semibold sm:text-2xl">{nextCategory.name}</h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {categoryPerformers.map((p) => (
          <PerformerOption
            key={p.id}
            performer={p}
            selected={selectedPerformerId === p.id}
            onSelect={() => setSelectedPerformerId(p.id)}
          />
        ))}
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <button
        type="button"
        onClick={() => void handleVote()}
        disabled={!selectedPerformerId || submitting}
        className="self-center rounded-full bg-white px-8 py-2.5 text-sm font-medium text-[#113DCB] hover:bg-white/90 disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Vote'}
      </button>
    </div>
  )
}
