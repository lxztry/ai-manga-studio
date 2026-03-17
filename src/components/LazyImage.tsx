import { useState, useRef, useEffect, type ImgHTMLAttributes } from 'react'

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'onError'> {
  fallback?: React.ReactNode
  rootMargin?: string
  threshold?: number
}

export function LazyImage({ 
  src, 
  alt, 
  fallback,
  rootMargin = '100px',
  threshold = 0.1,
  className,
  ...props 
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { rootMargin, threshold }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [rootMargin, threshold])

  return (
    <div ref={imgRef} className={`relative ${className || ''}`}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-700">
          {fallback || (
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      )}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`${className || ''} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          {...props}
        />
      )}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-500">
          <span className="text-sm">图片加载失败</span>
        </div>
      )}
    </div>
  )
}
