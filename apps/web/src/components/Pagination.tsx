export function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number
  pageCount: number
  onChange: (page: number) => void
}) {
  if (pageCount <= 1) return null

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-white/50">
        Page {page + 1} of {pageCount}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous page"
          onClick={() => onChange(Math.max(0, page - 1))}
          disabled={page === 0}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:pointer-events-none disabled:opacity-30"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path
              fillRule="evenodd"
              d="M12.79 5.23a.75.75 0 0 1 0 1.06L9.06 10l3.73 3.71a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Next page"
          onClick={() => onChange(Math.min(pageCount - 1, page + 1))}
          disabled={page === pageCount - 1}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:pointer-events-none disabled:opacity-30"
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
    </div>
  )
}
