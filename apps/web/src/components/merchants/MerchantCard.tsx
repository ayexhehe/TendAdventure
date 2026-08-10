import type { MerchantWithId } from '../../lib/merchants'
import { ImageWithSkeleton } from '../skeleton/ImageWithSkeleton'

function CardContent({ merchant }: { merchant: MerchantWithId }) {
  return (
    <div>
      {merchant.imageURL ? (
        <ImageWithSkeleton
          src={merchant.imageURL}
          alt=""
          className="aspect-video w-full"
          imgClassName="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
        />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-linear-to-br from-white/15 to-white/5 text-3xl font-semibold text-white/30">
          {merchant.name.charAt(0).toUpperCase() || '?'}
        </div>
      )}
      <div className="flex min-h-24 flex-col gap-1 p-3.5">
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
}: {
  merchant: MerchantWithId
  onClick?: () => void
}) {
  if (!onClick) {
    return (
      <div className="group overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
        <CardContent merchant={merchant} />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full overflow-hidden rounded-xl bg-white/5 text-left ring-1 ring-white/10 transition duration-300 hover:ring-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
    >
      <CardContent merchant={merchant} />
    </button>
  )
}
