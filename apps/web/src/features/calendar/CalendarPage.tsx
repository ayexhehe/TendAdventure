import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Layout } from '../../components/layout/Layout'
import { ActivityCard } from '../../components/calendar/ActivityCard'
import { CardSkeletonGrid, SpotlightSkeleton } from '../../components/skeleton/Skeletons'
import { ImageWithSkeleton } from '../../components/skeleton/ImageWithSkeleton'
import { Pagination } from '../../components/Pagination'
import { subscribeToActivities, type ActivityWithId } from '../../lib/activities'
import { formatDate } from '../../lib/date'

const PAGE_SIZE = 3

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[110px_1fr] sm:items-start sm:gap-4">
      <p className="text-xs font-medium tracking-[0.15em] text-white/35 uppercase">{label}</p>
      <p className="text-sm leading-relaxed text-white/70 md:text-base">{value}</p>
    </div>
  )
}

function ActivitySpotlight({ activity }: { activity: ActivityWithId }) {
  const upcoming = activity.date >= todayISO()

  return (
    <div className="overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
      {activity.imageURLs[0] ? (
        <ImageWithSkeleton
          src={activity.imageURLs[0]}
          alt=""
          className="aspect-video w-full md:aspect-21/9"
        />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-linear-to-br from-white/15 to-white/5 text-5xl font-semibold text-white/30 md:aspect-21/9">
          {activity.title.charAt(0).toUpperCase() || '?'}
        </div>
      )}
      <div className="flex flex-col gap-4 p-6 md:p-8">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <p className="text-xs font-medium tracking-[0.2em] text-white/40 uppercase">
              {formatDate(activity.date)}
            </p>
            {upcoming && (
              <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-300 uppercase">
                Upcoming
              </span>
            )}
          </div>
          <h2 className="text-2xl font-semibold text-white md:text-3xl">{activity.title}</h2>
        </div>

        <div className="flex flex-col gap-5">
          {activity.location && <DetailRow label="Location" value={activity.location} />}
          {activity.description && <DetailRow label="About" value={activity.description} />}
          {activity.committeeHead && <DetailRow label="Committee" value={activity.committeeHead} />}
        </div>
      </div>
    </div>
  )
}

export function CalendarPage() {
  const [activities, setActivities] = useState<ActivityWithId[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [featuredPage, setFeaturedPage] = useState(0)
  const [upcomingPage, setUpcomingPage] = useState(0)
  const [pastPage, setPastPage] = useState(0)
  const [searchParams] = useSearchParams()

  useEffect(
    () =>
      subscribeToActivities((a) => {
        setActivities(a)
        setLoading(false)
      }),
    [],
  )

  useEffect(() => {
    const id = searchParams.get('activity')
    if (id && activities.some((a) => a.id === id)) {
      setSelectedId(id)
    }
  }, [searchParams, activities])

  const selected = activities.find((a) => a.id === selectedId) ?? null
  const rest = selected ? activities.filter((a) => a.id !== selectedId) : activities

  const today = todayISO()
  const upcomingAll = rest.filter((a) => a.date >= today)
  const featured = upcomingAll.filter((a) => a.highlighted)
  const upcoming = upcomingAll.filter((a) => !a.highlighted)
  const past = rest.filter((a) => a.date < today).slice().reverse()
  const featuredPageCount = Math.max(1, Math.ceil(featured.length / PAGE_SIZE))
  const upcomingPageCount = Math.max(1, Math.ceil(upcoming.length / PAGE_SIZE))
  const pastPageCount = Math.max(1, Math.ceil(past.length / PAGE_SIZE))

  useEffect(() => {
    setFeaturedPage(0)
    setUpcomingPage(0)
    setPastPage(0)
  }, [selectedId])

  useEffect(() => {
    if (featuredPage >= featuredPageCount) setFeaturedPage(0)
  }, [featuredPage, featuredPageCount])

  useEffect(() => {
    if (upcomingPage >= upcomingPageCount) setUpcomingPage(0)
  }, [upcomingPage, upcomingPageCount])

  useEffect(() => {
    if (pastPage >= pastPageCount) setPastPage(0)
  }, [pastPage, pastPageCount])

  const selectActivity = (id: string) => {
    setSelectedId(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Layout>
      <div className="flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
        <h1 className="text-2xl font-semibold text-white md:text-3xl">Calendar of Activities</h1>

        {loading ? (
          <div className="flex flex-col gap-6">
            <SpotlightSkeleton />
            <CardSkeletonGrid count={3} />
          </div>
        ) : (
          <>
            {activities.length === 0 && (
              <p className="text-sm text-white/60">No activities yet — check back soon!</p>
            )}

            {selected && <ActivitySpotlight activity={selected} />}

            {featured.length > 0 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-amber-200">⭐ Featured Events</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {featured.map((a, i) => {
                    const isCurrentPage = Math.floor(i / PAGE_SIZE) === featuredPage
                    return (
                      <div key={a.id} className={isCurrentPage ? '' : 'hidden'}>
                        <ActivityCard
                          activity={a}
                          onClick={() => selectActivity(a.id)}
                          priority={isCurrentPage ? 'high' : 'low'}
                        />
                      </div>
                    )
                  })}
                </div>
                <Pagination
                  page={featuredPage}
                  pageCount={featuredPageCount}
                  onChange={setFeaturedPage}
                />
              </div>
            )}

            {upcoming.length > 0 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-white">Upcoming</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {upcoming.map((a, i) => {
                    const isCurrentPage = Math.floor(i / PAGE_SIZE) === upcomingPage
                    return (
                      <div key={a.id} className={isCurrentPage ? '' : 'hidden'}>
                        <ActivityCard
                          activity={a}
                          onClick={() => selectActivity(a.id)}
                          priority={isCurrentPage ? 'high' : 'low'}
                        />
                      </div>
                    )
                  })}
                </div>
                <Pagination
                  page={upcomingPage}
                  pageCount={upcomingPageCount}
                  onChange={setUpcomingPage}
                />
              </div>
            )}

            {past.length > 0 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-white/50">Past Activities</h2>
                <div className="grid grid-cols-1 gap-4 opacity-60 sm:grid-cols-2 md:grid-cols-3">
                  {past.map((a, i) => {
                    const isCurrentPage = Math.floor(i / PAGE_SIZE) === pastPage
                    return (
                      <div key={a.id} className={isCurrentPage ? '' : 'hidden'}>
                        <ActivityCard
                          activity={a}
                          onClick={() => selectActivity(a.id)}
                          priority={isCurrentPage ? 'high' : 'low'}
                        />
                      </div>
                    )
                  })}
                </div>
                <Pagination page={pastPage} pageCount={pastPageCount} onChange={setPastPage} />
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
