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
      className="group flex h-full flex-col overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/15 transition duration-300 hover:ring-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
    >
      {backgroundImage ? (
        <img
          src={backgroundImage}
          alt=""
          className="aspect-video w-full shrink-0 object-cover transition-transform duration-300 ease-out group-hover:scale-105"
        />
      ) : (
        <div className="flex aspect-video w-full shrink-0 items-center justify-center bg-linear-to-br from-white/15 to-white/5" />
      )}

      <div className="flex min-h-24 flex-1 flex-col justify-center gap-1.5 p-3.5">
        {stackImages.length > 0 ? (
          <div className="flex items-center -space-x-3">
            {stackImages.map((url, i) => (
              <img
                key={url}
                src={url}
                alt=""
                style={{ zIndex: stackImages.length - i }}
                className="h-8 w-8 rounded-full object-cover ring-2 ring-[#113DCB]"
              />
            ))}
            {remainingCount > 0 && (
              <span className="z-0 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-[10px] font-semibold text-white ring-2 ring-[#113DCB]">
                +{remainingCount}
              </span>
            )}
          </div>
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition group-hover:bg-white/25">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
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
