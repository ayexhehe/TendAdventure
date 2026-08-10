import { Link } from 'react-router-dom'

export function ViewAllCard({
  to,
  label,
  previewImageURLs = [],
}: {
  to: string
  label: string
  previewImageURLs?: (string | null | undefined)[]
}) {
  const images = previewImageURLs.filter((url): url is string => Boolean(url))
  const backgroundImage = images[0]
  const stackImages = images.slice(0, 2)
  const remainingCount = previewImageURLs.length

  return (
    <Link
      to={to}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/15 transition duration-300 hover:ring-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
    >
      <div className="aspect-video w-full" aria-hidden="true" />
      <div className="min-h-24 w-full" aria-hidden="true" />

      {backgroundImage && (
        <img
          src={backgroundImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35 transition-opacity duration-300 group-hover:opacity-45"
        />
      )}
      <div className="absolute inset-0 bg-linear-to-b from-[#113DCB]/50 via-[#113DCB]/75 to-[#113DCB]/90" />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-4 text-center">
        {stackImages.length > 0 ? (
          <div className="flex items-center -space-x-3">
            {stackImages.map((url, i) => (
              <img
                key={url}
                src={url}
                alt=""
                style={{ zIndex: stackImages.length - i }}
                className="h-9 w-9 rounded-full object-cover ring-2 ring-[#113DCB]"
              />
            ))}
            {remainingCount > 0 && (
              <span className="z-0 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-[11px] font-semibold text-white ring-2 ring-[#113DCB] backdrop-blur-sm">
                +{remainingCount}
              </span>
            )}
          </div>
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition group-hover:bg-white/25">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 0 1 0-1.06L10.94 10 7.21 6.29a.75.75 0 1 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0Z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        )}
        <span className="text-sm font-semibold text-white">{label}</span>
      </div>
    </Link>
  )
}
