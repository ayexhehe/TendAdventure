import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../../components/layout/Layout'
import { RequireAuth } from '../../components/auth/RequireAuth'
import { useAuth } from '../../hooks/useAuth'
import { subscribeToMerchants, type MerchantWithId } from '../../lib/merchants'
import { subscribeToMyCoupons, redeemCoupon, type TindaCouponWithId } from '../../lib/tindaCoupons'
import { ImageWithSkeleton } from '../../components/skeleton/ImageWithSkeleton'
import { SpotlightSkeleton } from '../../components/skeleton/Skeletons'

const SOURCE_LABEL: Record<TindaCouponWithId['source'], string> = {
  quizBowl: 'Quiz Bowl',
  tasked: 'taSKed',
  voting: 'Voting',
}

function CouponCard({ coupon, merchant }: { coupon: TindaCouponWithId; merchant: MerchantWithId | undefined }) {
  const [open, setOpen] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRedeem = async () => {
    if (!codeInput.trim()) {
      setError('Enter the tindahan code.')
      return
    }
    setError(null)
    setRedeeming(true)
    try {
      await redeemCoupon(coupon.id, codeInput)
    } catch {
      setError('Incorrect code — ask the seller to double-check.')
    } finally {
      setRedeeming(false)
    }
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl ring-1 ${
        coupon.redeemed ? 'bg-white/5 ring-white/10 opacity-70' : 'bg-white/10 ring-amber-300/40'
      }`}
    >
      <div className="flex items-center gap-3 p-4">
        {merchant?.imageURL ? (
          <ImageWithSkeleton src={merchant.imageURL} alt="" className="h-14 w-14 shrink-0 rounded-xl" />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-white/15 to-white/5 text-lg font-semibold text-white/30">
            {(merchant?.name ?? '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium tracking-[0.15em] text-white/40 uppercase">
            {merchant?.tindaZone || 'Tindahan'}
          </p>
          <h3 className="truncate font-semibold text-white">{merchant?.name ?? 'Merchant'}</h3>
          <p className="text-xs text-white/50">
            Won from {SOURCE_LABEL[coupon.source]} • {coupon.code}
          </p>
        </div>
        {coupon.redeemed ? (
          <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/60">
            Redeemed
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-amber-400/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#113DCB]">
            🎟️ Ready
          </span>
        )}
      </div>

      {!coupon.redeemed && (
        <div className="border-t border-white/10 p-4">
          {open ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-white/50">Seller: enter your tindahan code to confirm this coupon.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="Tindahan code"
                  className="flex-1 rounded-md bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40"
                />
                <button
                  type="button"
                  onClick={() => void handleRedeem()}
                  disabled={redeeming}
                  className="shrink-0 rounded-md bg-white px-4 py-2 text-sm font-medium text-[#113DCB] hover:bg-white/90 disabled:opacity-50"
                >
                  {redeeming ? 'Checking…' : 'Confirm'}
                </button>
              </div>
              {error && <p className="text-xs text-red-300">{error}</p>}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="text-xs font-medium text-white/70 underline hover:text-white"
            >
              Present to seller to redeem
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function TindaCoupons() {
  const { user } = useAuth()
  const [merchants, setMerchants] = useState<MerchantWithId[]>([])
  const [coupons, setCoupons] = useState<TindaCouponWithId[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => subscribeToMerchants(setMerchants), [])

  useEffect(() => {
    if (!user) return
    return subscribeToMyCoupons(user.uid, (c) => {
      setCoupons(c)
      setLoading(false)
    })
  }, [user])

  const merchantsById = Object.fromEntries(merchants.map((m) => [m.id, m]))

  if (!user || loading) {
    return (
      <div className="w-full max-w-2xl">
        <SpotlightSkeleton />
      </div>
    )
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-5 text-white">
      <div className="text-center">
        <h1 className="text-2xl font-semibold sm:text-3xl">Your TindaCoupons</h1>
        <p className="mt-2 text-sm text-white/60">
          Win games to earn coupons — each one's good at a specific tindahan.
        </p>
      </div>

      {coupons.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/5 p-8 text-center">
          <p className="text-sm text-white/60">You haven't won any TindaCoupons yet.</p>
          <Link
            to="/games"
            className="mt-1 rounded-full bg-white px-6 py-2 text-sm font-medium text-[#113DCB] hover:bg-white/90"
          >
            Play a game
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {coupons.map((c) => (
            <CouponCard key={c.id} coupon={c} merchant={merchantsById[c.merchantId]} />
          ))}
        </div>
      )}
    </div>
  )
}

export function TicketsPage() {
  return (
    <Layout>
      <RequireAuth>
        <TindaCoupons />
      </RequireAuth>
    </Layout>
  )
}
