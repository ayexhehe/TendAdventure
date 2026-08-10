import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout/Layout'
import { BannerSlider } from '../../components/banners/BannerSlider'
import { GameCard } from '../../components/games/GameCard'
import { QuizBowlIcon, TaskedIcon } from '../../components/games/gameIcons'
import { MerchantCard } from '../../components/merchants/MerchantCard'
import { ActivityCard } from '../../components/calendar/ActivityCard'
import { PaginatedCardGrid } from '../../components/PaginatedCardGrid'
import { ViewAllCard } from '../../components/ViewAllCard'
import { CardSkeletonGrid, SkeletonBlock } from '../../components/skeleton/Skeletons'
import { subscribeToBanners, type BannerWithId } from '../../lib/banners'
import { subscribeToMerchants, type MerchantWithId } from '../../lib/merchants'
import { subscribeToActivities, type ActivityWithId } from '../../lib/activities'

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
  const location = useLocation()
  const navigate = useNavigate()

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
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <GameCard
                to="/quizbowl"
                title="Quiz Bowl"
                description="Test your merchant knowledge and win prizes."
                icon={<QuizBowlIcon />}
              />
              <GameCard
                to="/tasked"
                title="taSKed"
                description="Complete 3 tasks to win a ticket."
                icon={<TaskedIcon />}
              />
            </div>
          </section>

          {(merchantsLoading || merchants.length > 0) && (
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold text-white">Merchant Highlights</h2>
              {merchantsLoading ? (
                <CardSkeletonGrid
                  count={3}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-3"
                />
              ) : (
                <PaginatedCardGrid cards={merchantCards} />
              )}
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
    </Layout>
  )
}
