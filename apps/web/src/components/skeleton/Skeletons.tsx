export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-2xl ring-1 ring-inset ring-white/10 ${className}`} />
}

export function TextLinesSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`skeleton-shimmer h-4 rounded-full ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/15">
      <div className="skeleton-shimmer aspect-video w-full" />
      <div className="flex flex-col gap-2 p-3.5">
        <div className="skeleton-shimmer h-2.5 w-16 rounded-full" />
        <div className="skeleton-shimmer h-4 w-3/4 rounded-full" />
        <div className="skeleton-shimmer h-3 w-1/2 rounded-full" />
      </div>
    </div>
  )
}

export function CardSkeletonGrid({
  count = 6,
  className = 'grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3',
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

export function SpotlightSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/15">
      <div className="skeleton-shimmer aspect-video w-full md:aspect-21/9" />
      <div className="flex flex-col gap-4 p-6 md:p-8">
        <div className="flex flex-col gap-2">
          <div className="skeleton-shimmer h-2.5 w-24 rounded-full" />
          <div className="skeleton-shimmer h-7 w-1/2 rounded-full" />
        </div>
        <TextLinesSkeleton lines={2} />
      </div>
    </div>
  )
}
