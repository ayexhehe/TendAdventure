import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout/Layout'
import { BannerSlider } from '../../components/banners/BannerSlider'
import { GameCard } from '../../components/games/GameCard'
import { HowToPlayModal } from '../../components/games/HowToPlayModal'
import { QuizBowlIcon, TaskedIcon, VotingIcon } from '../../components/games/gameIcons'
import { MerchantCard } from '../../components/merchants/MerchantCard'
import { ActivityCard } from '../../components/calendar/ActivityCard'
import { PaginatedCardGrid } from '../../components/PaginatedCardGrid'
import { ViewAllCard } from '../../components/ViewAllCard'
import { CardSkeletonGrid, SkeletonBlock } from '../../components/skeleton/Skeletons'
import { subscribeToBanners, type BannerWithId } from '../../lib/banners'
import { subscribeToMerchants, type MerchantWithId } from '../../lib/merchants'
import { subscribeToActivities, type ActivityWithId } from '../../lib/activities'
import { subscribeToGameSettings } from '../../lib/gameSettings'
import { isGameSoldOut } from '../../lib/tindaCoupons'
import { formatCooldown } from '../../lib/time'
import type { GameSettingsDoc } from '@tindadventure/shared'

const MERCHANT_PREVIEW_LIMIT = 2
const ACTIVITY_PREVIEW_LIMIT = 2

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function LandingPage() {
  const [banners, setBanners] = useState<BannerWithId[]>([])
  const [bannersLoading, setBannersLoading] = useState(true)
  const [merchants, setMerchants] = useState<MerchantWithId[]>([])
  const [merchantsLoading, setMerchantsLoading] = useState(true)
  const [activities, setActivities] = useState<ActivityWithId[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [gameSettings, setGameSettings] = useState<GameSettingsDoc | null>(null)
  const [howToPlayOpen, setHowToPlayOpen] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => subscribeToGameSettings(setGameSettings), [])
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(
    () =>
      subscribeToBanners((b) => {
        setBanners(b)
        setBannersLoading(false)
      }),
    [],
  )
  useEffect(
    () =>
      subscribeToMerchants((m) => {
        setMerchants(m)
        setMerchantsLoading(false)
      }),
    [],
  )
  useEffect(
    () =>
      subscribeToActivities((a) => {
        setActivities(a)
        setActivitiesLoading(false)
      }),
    [],
  )

  useEffect(() => {
    if (!location.hash) return
    document.querySelector(location.hash)?.scrollIntoView({ behavior: 'smooth' })
  }, [location.hash])

  const upcomingActivities = activities.filter((a) => a.date >= todayISO())
  const quizBowlOpen = gameSettings?.quizBowlOpen ?? true
  const taskedOpen = gameSettings?.taskedOpen ?? true
  const votingWindowEndsAt = gameSettings?.votingWindowEndsAt ?? null
  const votingLive = votingWindowEndsAt != null && votingWindowEndsAt > now
  const votingRemainingMs = votingWindowEndsAt != null ? votingWindowEndsAt - now : 0
  const merchantsSectionEnabled = gameSettings?.merchantsSectionEnabled ?? true
  const quizSoldOut = isGameSoldOut('quizBowl', gameSettings, merchants)
  const taskedSoldOut = isGameSoldOut('tasked', gameSettings, merchants)
  const allGamesClosed = !quizBowlOpen && !taskedOpen && !votingLive

  const merchantCards = [
    ...merchants.slice(0, MERCHANT_PREVIEW_LIMIT).map((m) => (
      <MerchantCard
        key={m.id}
        merchant={m}
        onClick={() => navigate(`/merchants?merchant=${m.id}`)}
      />
    )),
    ...(merchants.length > MERCHANT_PREVIEW_LIMIT
      ? [
          <ViewAllCard
            key="view-all"
            to="/merchants"
            label="Discover More Merchants"
            previewImageURLs={merchants.slice(MERCHANT_PREVIEW_LIMIT).map((m) => m.imageURL)}
          />,
        ]
      : []),
  ]

  const activityCards = [
    ...upcomingActivities.slice(0, ACTIVITY_PREVIEW_LIMIT).map((a) => (
      <ActivityCard
        key={a.id}
        activity={a}
        onClick={() => navigate(`/calendar?activity=${a.id}`)}
      />
    )),
    ...(upcomingActivities.length > ACTIVITY_PREVIEW_LIMIT
      ? [
          <ViewAllCard
            key="view-all"
            to="/calendar"
            label="Discover More Activities"
            previewImageURLs={upcomingActivities
              .slice(ACTIVITY_PREVIEW_LIMIT)
              .map((a) => a.imageURLs[0])}
          />,
        ]
      : []),
  ]

  return (
    <Layout>
      <div className="flex w-full flex-col items-center gap-16 pb-10">
        {bannersLoading ? (
          <div className="w-full max-w-7xl px-4">
            <SkeletonBlock className="aspect-video w-full md:aspect-21/9" />
          </div>
        ) : (
          banners.length > 0 && (
            <div className="w-full max-w-7xl px-4">
              <BannerSlider banners={banners} />
            </div>
          )
        )}

        <div className="flex w-full max-w-5xl flex-col gap-16 px-4">
          <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-amber-400/25 via-white/10 to-transparent p-6 ring-1 ring-amber-300/40 sm:p-8">
            <div className="mb-5 text-center sm:text-left">
              <p className="text-xs font-semibold tracking-[0.2em] text-amber-300 uppercase">🎟️ Play &amp; Win</p>
              <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                Win a TindaCoupon by joining our games!
              </h2>
              <p className="mt-1 text-sm text-white/70">
                Test your merchant know-how, complete fun challenges, and score exclusive prizes.
              </p>
              {allGamesClosed && (
                <p className="mt-3 text-sm font-medium text-amber-200">
                  🗓️ Games will open on August 21 and 22 — Celebration of Linggo ng Kabataan with
                  Guadalupe!
                </p>
              )}
              {votingLive && (
                <Link
                  to="/voting"
                  className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full bg-red-500/90 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 sm:justify-start"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-white" />
                    Voting is live!
                  </span>
                  <span className="text-white/80">Ends in {formatCooldown(votingRemainingMs)}</span>
                  <span className="whitespace-nowrap">Vote now →</span>
                </Link>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2 sm:justify-start">
                <button
                  type="button"
                  onClick={() => setHowToPlayOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/25"
                >
                  ❓ How to Play
                </button>
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/20 hover:text-white"
                >
                  More Info →
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <GameCard
                to="/quizbowl"
                title="Quiz Bowl"
                description="Test your merchant knowledge and win prizes."
                icon={<QuizBowlIcon />}
                closed={!quizBowlOpen}
                soldOut={quizSoldOut}
                ticketProgress={{
                  issued: gameSettings?.quizBowlTicketsIssued ?? 0,
                  total: gameSettings?.quizBowlTicketsTotal ?? 0,
                }}
              />
              <GameCard
                to="/tasked"
                title="You are taSKed"
                description="Complete 3 tasks to win a TindaCoupon."
                icon={<TaskedIcon />}
                closed={!taskedOpen}
                soldOut={taskedSoldOut}
                ticketProgress={{
                  issued: gameSettings?.taskedTicketsIssued ?? 0,
                  total: gameSettings?.taskedTicketsTotal ?? 0,
                }}
              />
              <GameCard
                to="/voting"
                title="Voting"
                description="Vote for your favorite performers — TindaCoupons drop randomly."
                icon={<VotingIcon />}
                closed={!votingLive}
                liveUntil={gameSettings?.votingWindowEndsAt ?? null}
              />
            </div>
          </section>

          {merchantsSectionEnabled ? (
            (merchantsLoading || merchants.length > 0) && (
              <section className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold text-white">Know the Tindahans</h2>
                {merchantsLoading ? (
                  <CardSkeletonGrid
                    count={3}
                    className="grid grid-cols-1 gap-4 sm:grid-cols-3"
                  />
                ) : (
                  <PaginatedCardGrid cards={merchantCards} />
                )}
              </section>
            )
          ) : (
            <section>
              <Link
                to="/be-a-tindahan"
                className="group flex w-full flex-col items-start gap-5 overflow-hidden rounded-3xl bg-linear-to-br from-amber-400/25 via-white/10 to-transparent p-6 ring-1 ring-amber-300/40 transition hover:ring-amber-300/70 sm:flex-row sm:items-center sm:justify-between sm:p-8"
              >
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] text-amber-300 uppercase">
                    🛍️ Join Us
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                    Be one of the Tindahan!
                  </h3>
                  <p className="mt-1 text-sm text-white/70">
                    Get a FREE booth and ₱3,000 worth of TindaCoupon subsidy for your products or
                    services — promote what you sell with guaranteed income.
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
            </section>
          )}

          <section id="calendar-of-activities" className="flex flex-col gap-4 scroll-mt-24">
            <h2 className="text-xl font-semibold text-white">Calendar of Activities</h2>
            {activitiesLoading ? (
              <CardSkeletonGrid count={3} className="grid grid-cols-1 gap-4 sm:grid-cols-3" />
            ) : upcomingActivities.length > 0 ? (
              <PaginatedCardGrid cards={activityCards} />
            ) : (
              <p className="text-sm text-white/60">No upcoming activities yet — check back soon!</p>
            )}
          </section>
        </div>
      </div>

      <HowToPlayModal open={howToPlayOpen} onClose={() => setHowToPlayOpen(false)} />
    </Layout>
  )
}
