import { useEffect, useState } from 'react'
import { Layout } from '../../components/layout/Layout'
import { subscribeToAbout } from '../../lib/about'
import { SkeletonBlock, TextLinesSkeleton } from '../../components/skeleton/Skeletons'
import { ImageWithSkeleton } from '../../components/skeleton/ImageWithSkeleton'
import type { AboutDoc } from '@tindadventure/shared'

export function AboutPage() {
  const [about, setAbout] = useState<AboutDoc | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(
    () =>
      subscribeToAbout((a) => {
        setAbout(a)
        setLoading(false)
      }),
    [],
  )

  return (
    <Layout>
      <div className="flex w-full max-w-4xl flex-col gap-8 px-4 py-10">
        <div>
          <p className="mb-2 text-xs font-medium tracking-[0.2em] text-white/40 uppercase">
            About Us
          </p>
          <h1 className="text-2xl font-semibold text-white md:text-3xl">SK Guadalupe</h1>
        </div>

        {loading ? (
          <div className="flex flex-col gap-6">
            <SkeletonBlock className="aspect-video w-full md:aspect-21/9" />
            <TextLinesSkeleton lines={4} />
          </div>
        ) : (
          <>
            {about?.imageURL && (
              <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
                <ImageWithSkeleton
                  src={about.imageURL}
                  alt=""
                  className="aspect-video w-full md:aspect-21/9"
                />
              </div>
            )}

            {about?.description ? (
              <div className="grid gap-2 sm:grid-cols-[110px_1fr] sm:gap-6">
                <p className="text-xs font-medium tracking-[0.15em] text-white/35 uppercase">
                  Our Story
                </p>
                <p className="text-sm leading-relaxed whitespace-pre-line text-white/70 md:text-base">
                  {about.description}
                </p>
              </div>
            ) : (
              <p className="text-sm text-white/60">More information coming soon.</p>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
