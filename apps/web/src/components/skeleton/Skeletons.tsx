export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/20 ring-1 ring-inset ring-white/10 ${className}`} />
}

export function TextLinesSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 animate-pulse rounded-full bg-white/20 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/15">
      <div className="aspect-video w-full animate-pulse bg-white/20" />
      <div className="flex flex-col gap-2 p-3.5">
        <div className="h-2.5 w-16 animate-pulse rounded-full bg-white/20" />
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-white/20" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-white/20" />
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
      <div className="aspect-video w-full animate-pulse bg-white/20 md:aspect-21/9" />
      <div className="flex flex-col gap-4 p-6 md:p-8">
        <div className="flex flex-col gap-2">
          <div className="h-2.5 w-24 animate-pulse rounded-full bg-white/20" />
          <div className="h-7 w-1/2 animate-pulse rounded-full bg-white/20" />
        </div>
        <TextLinesSkeleton lines={2} />
      </div>
    </div>
  )
}
