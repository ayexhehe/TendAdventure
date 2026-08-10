import { Link } from 'react-router-dom'
import type { TindaCouponSource } from '@tindadventure/shared'
import type { MerchantWithId } from '../../lib/merchants'
import type { TindaCouponWithId } from '../../lib/tindaCoupons'
import { ImageWithSkeleton } from '../skeleton/ImageWithSkeleton'

export function CouponWinCelebration({
  source,
  coupons,
  merchants,
}: {
  source: TindaCouponSource
  coupons: TindaCouponWithId[]
  merchants: MerchantWithId[]
}) {
  const coupon = coupons.find((c) => c.source === source)
  if (!coupon) return null
  const merchant = merchants.find((m) => m.id === coupon.merchantId)

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <div className="w-full overflow-hidden rounded-2xl bg-white/10 ring-2 ring-amber-400/60">
        {merchant?.imageURL ? (
          <ImageWithSkeleton src={merchant.imageURL} alt="" className="aspect-video w-full" />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-linear-to-br from-amber-400/25 to-white/5 text-3xl font-semibold text-white/40">
            {(merchant?.name ?? '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="p-4 text-left">
          {merchant?.tindaZone && (
            <p className="text-[10px] font-medium tracking-[0.15em] text-amber-300 uppercase">
              {merchant.tindaZone}
            </p>
          )}
          <p className="text-lg font-semibold text-white">{merchant?.name ?? 'A tindahan'}</p>
          <p className="mt-1.5 font-mono text-xs text-white/60">Code: {coupon.code}</p>
        </div>
      </div>
      <Link
        to="/tickets"
        className="rounded-full bg-white px-6 py-2.5 text-sm font-medium text-[#113DCB] hover:bg-white/90"
      >
        View my TindaCoupons
      </Link>
    </div>
  )
}
