import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ImageWithSkeleton } from '../skeleton/ImageWithSkeleton'
import type { BannerWithId } from '../../lib/banners'

const AUTO_ADVANCE_MS = 5000

export function BannerSlider({ banners }: { banners: BannerWithId[] }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (index >= banners.length) setIndex(0)
  }, [banners.length, index])

  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length)
    }, AUTO_ADVANCE_MS)
    return () => clearInterval(timer)
  }, [banners.length, index])

  if (banners.length === 0) return null

  const goTo = (i: number) => setIndex(((i % banners.length) + banners.length) % banners.length)

  return (
    <div
      role="region"
      aria-label="Festival banners"
      aria-roledescription="carousel"
      className="relative mx-auto w-full overflow-hidden rounded-2xl aspect-video md:aspect-21/9"
    >
      {banners.map((b, i) => {
        const slideClass = `absolute inset-0 h-full w-full text-center transition-opacity duration-700 ${
          i === index ? 'opacity-100' : 'pointer-events-none opacity-0'
        } ${b.linkTo ? 'cursor-pointer' : ''}`
        const slideContent = (
          <>
            <ImageWithSkeleton
              src={b.imageURL}
              alt={b.caption || 'Festival banner'}
              className="h-full w-full"
            />
            {b.caption && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent px-4 py-3 md:px-6 md:py-4">
                <p className="text-center text-sm font-medium text-white md:text-base">
                  {b.caption}
                </p>
              </div>
            )}
          </>
        )

        return b.linkTo ? (
          <Link key={b.id} to={b.linkTo} className={slideClass}>
            {slideContent}
          </Link>
        ) : (
          <div key={b.id} className={slideClass}>
            {slideContent}
          </div>
        )
      })}

      {banners.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous banner"
            onClick={(e) => {
              e.stopPropagation()
              goTo(index - 1)
            }}
            className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 md:left-4 md:h-10 md:w-10"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 md:h-5 md:w-5">
              <path
                fillRule="evenodd"
                d="M12.79 5.23a.75.75 0 0 1 0 1.06L9.06 10l3.73 3.71a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next banner"
            onClick={(e) => {
              e.stopPropagation()
              goTo(index + 1)
            }}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 md:right-4 md:h-10 md:w-10"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 md:h-5 md:w-5">
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 0 1 0-1.06L10.94 10 7.21 6.29a.75.75 0 1 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0Z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center gap-1.5 md:top-3">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                onClick={(e) => {
                  e.stopPropagation()
                  goTo(i)
                }}
                className={`pointer-events-auto h-1.5 rounded-full transition-all ${
                  i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
