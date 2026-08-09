import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Layout } from '../../components/layout/Layout'
import { MerchantCard } from '../../components/merchants/MerchantCard'
import { CardSkeletonGrid, SpotlightSkeleton } from '../../components/skeleton/Skeletons'
import { ImageWithSkeleton } from '../../components/skeleton/ImageWithSkeleton'
import { subscribeToMerchants, type MerchantWithId } from '../../lib/merchants'

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[110px_1fr] sm:gap-4">
      <p className="text-xs font-medium tracking-[0.15em] text-white/35 uppercase">{label}</p>
      <p className="text-sm leading-relaxed text-white/70 md:text-base">{value}</p>
    </div>
  )
}

function MerchantSpotlight({ merchant }: { merchant: MerchantWithId }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
      {merchant.imageURL ? (
        <ImageWithSkeleton
          src={merchant.imageURL}
          alt=""
          className="aspect-video w-full md:aspect-21/9"
        />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-linear-to-br from-white/15 to-white/5 text-5xl font-semibold text-white/30 md:aspect-21/9">
          {merchant.name.charAt(0).toUpperCase() || '?'}
        </div>
      )}
      <div className="flex flex-col gap-4 p-6 md:p-8">
        <div>
          <p className="mb-1.5 text-xs font-medium tracking-[0.2em] text-white/40 uppercase">
            {merchant.tindaZone || 'Now viewing'}
          </p>
          <h2 className="text-2xl font-semibold text-white md:text-3xl">{merchant.name}</h2>
        </div>

        {merchant.product && <DetailRow label="Sells" value={merchant.product} />}
        {merchant.description && <DetailRow label="About" value={merchant.description} />}
        {merchant.youthRepresentative && (
          <DetailRow label="Rep" value={merchant.youthRepresentative} />
        )}
      </div>
    </div>
  )
}

export function MerchantsPage() {
  const [merchants, setMerchants] = useState<MerchantWithId[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchParams] = useSearchParams()

  useEffect(
    () =>
      subscribeToMerchants((m) => {
        setMerchants(m)
        setLoading(false)
      }),
    [],
  )

  useEffect(() => {
    const id = searchParams.get('merchant')
    if (id && merchants.some((m) => m.id === id)) {
      setSelectedId(id)
    }
  }, [searchParams, merchants])

  const selected = merchants.find((m) => m.id === selectedId) ?? null
  const others = selected ? merchants.filter((m) => m.id !== selectedId) : merchants

  const selectMerchant = (id: string) => {
    setSelectedId(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Layout>
      <div className="flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
        <h1 className="text-2xl font-semibold text-white md:text-3xl">Merchants</h1>

        {loading ? (
          <div className="flex flex-col gap-6">
            <SpotlightSkeleton />
            <CardSkeletonGrid count={3} />
          </div>
        ) : (
          <>
            {merchants.length === 0 && (
              <p className="text-sm text-white/60">No merchants yet — check back soon!</p>
            )}

            {selected && <MerchantSpotlight merchant={selected} />}

            {others.length > 0 && (
              <div className="flex flex-col gap-4">
                {selected && <h2 className="text-lg font-semibold text-white">More Merchants</h2>}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {others.map((m) => (
                    <MerchantCard key={m.id} merchant={m} onClick={() => selectMerchant(m.id)} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
