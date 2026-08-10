import type { MerchantWithId } from '../../lib/merchants'
import { ImageWithSkeleton } from '../skeleton/ImageWithSkeleton'

function CardContent({
  merchant,
  priority,
}: {
  merchant: MerchantWithId
  priority?: 'high' | 'low' | 'auto'
}) {
  return (
    <div className="flex h-full w-full flex-col">
      {merchant.imageURL ? (
        <ImageWithSkeleton
          src={merchant.imageURL}
          alt=""
          className="aspect-video w-full shrink-0"
          imgClassName="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          priority={priority}
        />
      ) : (
        <div className="flex aspect-video w-full shrink-0 items-center justify-center bg-linear-to-br from-white/15 to-white/5 text-3xl font-semibold text-white/30">
          {merchant.name.charAt(0).toUpperCase() || '?'}
        </div>
      )}
      <div className="flex min-h-24 flex-1 flex-col gap-1 p-3.5">
        {merchant.tindaZone && (
          <p className="text-[10px] font-medium tracking-[0.15em] text-white/40 uppercase">
            {merchant.tindaZone}
          </p>
        )}
        <h3 className="line-clamp-1 font-semibold text-white">{merchant.name}</h3>
        {merchant.product && <p className="line-clamp-1 text-sm text-white/60">{merchant.product}</p>}
      </div>
    </div>
  )
}

export function MerchantCard({
  merchant,
  onClick,
  priority,
}: {
  merchant: MerchantWithId
  onClick?: () => void
  priority?: 'high' | 'low' | 'auto'
}) {
  if (!onClick) {
    return (
      <div className="group flex h-full overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
        <CardContent merchant={merchant} priority={priority} />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full w-full overflow-hidden rounded-xl bg-white/5 text-left ring-1 ring-white/10 transition duration-300 hover:ring-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
    >
      <CardContent merchant={merchant} priority={priority} />
    </button>
  )
}
