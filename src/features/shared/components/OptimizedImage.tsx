import React, { useState } from 'react'
import { Film } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface OptimizedImageProps {
  src?: string
  alt: string
  className?: string
  placeholderUrl?: string
  fallbackElement?: React.ReactNode
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void
}

/**
 * OptimizedImage component with native lazy loading and blur placeholder effect
 * 
 * Features:
 * - Native loading="lazy" for browser-level optimization
 * - Blur placeholder while image loads
 * - Smooth transition when image finishes loading
 * - Fallback support for missing/failed images
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  placeholderUrl = 'https://via.placeholder.com/300x450?text=No+Image',
  fallbackElement,
  onError
}) => {
  const { t } = useTranslation()
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoaded(true)
  }

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true)
    if (onError) {
      onError(e)
    } else {
      // Default fallback
      (e.target as HTMLImageElement).src = placeholderUrl
    }
  }

  // If no src provided, show fallback
  if (!src) {
    return fallbackElement ? (
      <>{fallbackElement}</>
    ) : (
      <div className={`bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <Film className="w-8 h-8 mx-auto mb-1 text-zinc-500" />
          <div className="text-[10px] text-zinc-500 font-black uppercase">{t('no_image')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden">
      {/* Blur placeholder while loading */}
      {!isLoaded && (
        <div
          className={`absolute inset-0 bg-cover bg-center blur-lg scale-110 ${className}`}
          style={{
            backgroundImage: `url(${src})`,
            opacity: hasError ? 0 : 0.6,
            zIndex: 1
          }}
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      <img
        src={src}
        alt={alt}
        className={`${className} transition-all duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        style={{
          position: 'relative',
          zIndex: isLoaded ? 2 : 1
        }}
      />
    </div>
  )
}

export default OptimizedImage
