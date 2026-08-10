import { useEffect, useRef, useState } from 'react'

export function ImageWithSkeleton({
  src,
  alt,
  className = '',
  imgClassName = 'object-cover',
  priority = 'auto',
}: {
  src: string
  alt: string
  className?: string
  imgClassName?: string
  priority?: 'high' | 'low' | 'auto'
}) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(imgRef.current?.complete ?? false)
  }, [src])

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && (
        <div className="skeleton-shimmer absolute inset-0 ring-1 ring-inset ring-white/10" />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        decoding="async"
        fetchPriority={priority}
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
      />
    </div>
  )
}
