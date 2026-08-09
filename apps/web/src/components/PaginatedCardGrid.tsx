import { useEffect, useState, type ReactNode } from 'react'

const AUTO_ADVANCE_MS = 10000

export function PaginatedCardGrid({
  cards,
  gridClassName = 'grid grid-cols-1 gap-4 sm:grid-cols-3',
}: {
  cards: ReactNode[]
  gridClassName?: string
}) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (index >= cards.length) setIndex(0)
  }, [cards.length, index])

  useEffect(() => {
    if (cards.length <= 1) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % cards.length)
    }, AUTO_ADVANCE_MS)
    return () => clearInterval(timer)
  }, [cards.length, index])

  const goTo = (i: number) => setIndex(((i % cards.length) + cards.length) % cards.length)

  return (
    <div className="flex flex-col gap-4">
      <div className={gridClassName}>
        {cards.map((card, i) => (
          <div key={i} className={i === index ? 'block' : 'hidden sm:block'}>
            {card}
          </div>
        ))}
      </div>

      {cards.length > 1 && (
        <div className="flex items-center justify-center gap-3 sm:hidden">
          <button
            type="button"
            aria-label="Previous"
            onClick={() => goTo(index - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path
                fillRule="evenodd"
                d="M12.79 5.23a.75.75 0 0 1 0 1.06L9.06 10l3.73 3.71a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <div className="flex gap-1.5">
            {cards.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to card ${i + 1}`}
                aria-current={i === index}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            aria-label="Next"
            onClick={() => goTo(index + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 0 1 0-1.06L10.94 10 7.21 6.29a.75.75 0 1 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
