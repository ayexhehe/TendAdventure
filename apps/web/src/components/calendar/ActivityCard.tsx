import type { ActivityWithId } from '../../lib/activities'
import { formatDate } from '../../lib/date'
import { ImageWithSkeleton } from '../skeleton/ImageWithSkeleton'

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function CardContent({ activity }: { activity: ActivityWithId }) {
  const upcoming = activity.date >= todayISO()

  return (
    <div>
      {activity.imageURLs[0] ? (
        <ImageWithSkeleton
          src={activity.imageURLs[0]}
          alt=""
          className="aspect-video w-full"
          imgClassName="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
        />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-linear-to-br from-white/15 to-white/5 text-3xl font-semibold text-white/30">
          {activity.title.charAt(0).toUpperCase() || '?'}
        </div>
      )}
      <div className="flex min-h-24 flex-col gap-1 p-3.5">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-medium tracking-[0.15em] text-white/40 uppercase">
            {formatDate(activity.date)}
          </p>
          {upcoming && (
            <span className="rounded-full bg-emerald-400/15 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-emerald-300 uppercase">
              Upcoming
            </span>
          )}
        </div>
        <h3 className="font-semibold text-white">{activity.title}</h3>
        {activity.location && (
          <p className="line-clamp-1 text-sm text-white/60">{activity.location}</p>
        )}
      </div>
    </div>
  )
}

export function ActivityCard({
  activity,
  onClick,
}: {
  activity: ActivityWithId
  onClick?: () => void
}) {
  if (!onClick) {
    return (
      <div className="group overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
        <CardContent activity={activity} />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full overflow-hidden rounded-xl bg-white/5 text-left ring-1 ring-white/10 transition duration-300 hover:ring-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
    >
      <CardContent activity={activity} />
    </button>
  )
}
