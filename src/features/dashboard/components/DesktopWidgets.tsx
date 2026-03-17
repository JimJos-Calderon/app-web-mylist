import React, { Suspense, lazy, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const SpotifyGlassCard = lazy(() =>
  import('@/features/shared').then((module) => ({
    default: module.SpotifyGlassCard,
  }))
)

const SpotifyWidgetSkeleton: React.FC = () => {
  const { t } = useTranslation()

  return (
    <div
      className="w-80 h-[480px] bg-[rgba(var(--color-accent-primary-rgb),0.05)] border border-[rgba(var(--color-accent-primary-rgb),0.3)] backdrop-blur-xl animate-pulse flex items-center justify-center"
      style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-12 h-12 bg-[rgba(var(--color-accent-primary-rgb),0.1)] border border-accent-primary flex items-center justify-center animate-pulse"
          style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
        />
        <p className="text-accent-primary font-mono text-[10px] uppercase tracking-widest opacity-80">
          {'>'} {t('states.loading_widget')}
        </p>
      </div>
    </div>
  )
}

const DesktopWidgets: React.FC = () => {
  const [playerPosition, setPlayerPosition] = useState({ x: window.innerWidth - 400, y: window.innerHeight - 400 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const [playlistPosition, setPlaylistPosition] = useState({ x: 50, y: window.innerHeight - 400 })
  const [isPlaylistDragging, setIsPlaylistDragging] = useState(false)
  const [playlistDragOffset, setPlaylistDragOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPlayerPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        })
      }

      if (isPlaylistDragging) {
        setPlaylistPosition({
          x: e.clientX - playlistDragOffset.x,
          y: e.clientY - playlistDragOffset.y,
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsPlaylistDragging(false)
    }

    if (isDragging || isPlaylistDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset, isPlaylistDragging, playlistDragOffset])

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - playerPosition.x,
      y: e.clientY - playerPosition.y,
    })
  }

  const handlePlaylistMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsPlaylistDragging(true)
    setPlaylistDragOffset({
      x: e.clientX - playlistPosition.x,
      y: e.clientY - playlistPosition.y,
    })
  }

  return (
    <>
      <Suspense fallback={<SpotifyWidgetSkeleton />}>
        <div
          className="hidden lg:block"
          onMouseDown={handleMouseDown}
          style={{
            position: 'fixed',
            left: `${playerPosition.x}px`,
            top: `${playerPosition.y}px`,
            zIndex: 30,
          }}
        >
          <SpotifyGlassCard
            spotifyUrl="https://open.spotify.com/embed/playlist/3WyehWydbIc9FCDVDHbTbZ?utm_source=generator&theme=0"
            accentColor="var(--color-accent-primary)"
            isDragging={isDragging}
          />
        </div>
      </Suspense>

      <Suspense fallback={<SpotifyWidgetSkeleton />}>
        <div
          className="hidden lg:block"
          onMouseDown={handlePlaylistMouseDown}
          style={{
            position: 'fixed',
            left: `${playlistPosition.x}px`,
            top: `${playlistPosition.y}px`,
            zIndex: 30,
            pointerEvents: 'auto',
          }}
        >
          <SpotifyGlassCard
            spotifyUrl="https://open.spotify.com/embed/playlist/6y6uFhkd4QSgiZ4XBZekNb?utm_source=generator"
            accentColor="var(--color-accent-secondary)"
            isDragging={isPlaylistDragging}
          />
        </div>
      </Suspense>
    </>
  )
}

export default DesktopWidgets