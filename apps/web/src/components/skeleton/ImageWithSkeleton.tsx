import { useEffect, useRef, useState } from 'react'

export function ImageWithSkeleton({
  src,
  alt,
  className = '',
  imgClassName = 'object-cover',
}: {
  src: string
  alt: string
  className?: string
  imgClassName?: string
}) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(imgRef.current?.complete ?? false)
  }, [src])

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-white/20 ring-1 ring-inset ring-white/10" />}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
      />
    </div>
  )
}
