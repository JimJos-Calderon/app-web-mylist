import React, { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectCoverflow } from 'swiper/modules'
import { ListItem, useReducedMotion } from '@/features/shared'
import { Grid3x3, ChevronLeft, ChevronRight } from 'lucide-react'
import StatsWidget from './StatsWidget'

interface RingSliderProps {
  items: ListItem[]
  allItems: ListItem[]
  onOpenDetails: (item: ListItem) => void
  userOwnerId?: string
  onViewModeChange?: (mode: 'grid' | 'ring') => void
}

const RingSlider: React.FC<RingSliderProps> = ({
  items,
  allItems,
  onOpenDetails,
  userOwnerId,
  onViewModeChange,
}) => {
  const { t } = useTranslation()
  const itemsWithPoster = items.filter((item) => Boolean(item.poster_url))
  const swiperRef = useRef<any>(null)
  const [activeItemId, setActiveItemId] = useState<string>(itemsWithPoster[0]?.id || '')
  const [liveText, setLiveText] = useState('')
  const prefersReducedMotion = useReducedMotion()

  const handleCarouselKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      swiperRef.current?.swiper.slidePrev()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      swiperRef.current?.swiper.slideNext()
    } else if (e.key === 'Home') {
      e.preventDefault()
      swiperRef.current?.swiper.slideToLoop(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      swiperRef.current?.swiper.slideToLoop(itemsWithPoster.length - 1)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const active = itemsWithPoster.find((i) => i.id === activeItemId)
      if (active) onOpenDetails(active)
    }
  }, [activeItemId, itemsWithPoster, onOpenDetails])

  if (itemsWithPoster.length === 0) {
    return (
      <div className="w-full py-12 bg-black/20 backdrop-blur-sm border-y border-[rgba(var(--color-accent-primary-rgb),0.3)] text-center">
        <p className="text-[var(--color-text-muted)] text-sm">{t('states.no_images')}</p>
      </div>
    )
  }

  const handleSlideClick = (itemId: string) => {
    if (itemId === activeItemId) {
      const item = itemsWithPoster.find((i) => i.id === itemId)
      if (item) onOpenDetails(item)
    } else {
      const slideIndex = itemsWithPoster.findIndex((i) => i.id === itemId)
      if (slideIndex !== -1) {
        swiperRef.current?.swiper.slideToLoop(slideIndex)
      }
    }
  }

  const handlePrevious = () => swiperRef.current?.swiper.slidePrev()
  const handleNext = () => swiperRef.current?.swiper.slideNext()

  const activeItem = itemsWithPoster.find((item) => item.id === activeItemId)
  const isOwn = activeItem?.user_id === userOwnerId

  return (
    <div
      className="w-full min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: `linear-gradient(to bottom, var(--color-bg-base), rgba(var(--color-accent-primary-rgb),0.06), var(--color-bg-base))` }}
      role="region"
      aria-roledescription="carrusel"
      aria-label={`Carrusel de ${itemsWithPoster.length} títulos`}
    >
      {/* Background Grid Effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div
          style={{
            backgroundImage: `linear-gradient(to right, var(--color-accent-primary) 1px, transparent 1px), linear-gradient(to bottom, var(--color-accent-primary) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Radial Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at center, rgba(var(--color-accent-secondary-rgb),0.08) 0%, transparent 60%)` }}
      />

      {/* Screen reader live announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveText}
      </div>

      {/* Keyboard-navigable wrapper */}
      <div
        tabIndex={0}
        role="group"
        aria-label={t('buttons.ring_navigation')}
        onKeyDown={handleCarouselKeyDown}
        className="w-full relative z-10 outline-none"
      >
        <Swiper
          ref={swiperRef}
          effect={'coverflow'}
          grabCursor={true}
          centeredSlides={true}
          slidesPerView={'auto'}
          loop={true}
          autoplay={false}
          coverflowEffect={{
            rotate: prefersReducedMotion ? 0 : 45,
            stretch: 0,
            depth: prefersReducedMotion ? 0 : 250,
            modifier: 1,
            slideShadows: false,
          }}
          speed={prefersReducedMotion ? 0 : 300}
          modules={[EffectCoverflow]}
          className="w-full h-auto"
          onSlideChange={(swiper) => {
            const currentSlide = itemsWithPoster[swiper.realIndex]
            if (currentSlide) {
              setActiveItemId(currentSlide.id)
              setLiveText(`${currentSlide.titulo} — ${swiper.realIndex + 1} de ${itemsWithPoster.length}`)
            }
          }}
        >
          {itemsWithPoster.map((item) => (
            <SwiperSlide key={item.id} className="!w-[280px] sm:!w-[340px] lg:!w-[380px]">
              {({ isActive }) => (
                <div
                  role="button"
                  tabIndex={-1}
                  aria-label={`${item.titulo}${isActive ? ' — activo' : ''}. ${t('press_enter_for_details')}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleSlideClick(item.id)
                    }
                  }}
                  onClick={() => handleSlideClick(item.id)}
                  className={`relative transition-all duration-500 cursor-pointer ${
                    isActive ? 'scale-100' : 'scale-75 opacity-70 hover:scale-80 hover:opacity-80'
                  }`}
                >
                  {/* Main Container */}
                  <div className="relative w-full rounded-3xl overflow-hidden">
                    {/* Animated Border Glow */}
                    <div
                      className={`absolute -inset-1 rounded-3xl pointer-events-none transition-all duration-700 ${
                        isActive ? 'opacity-100 blur-lg' : 'opacity-40 blur-sm'
                      }`}
                      style={{
                        background: isActive
                          ? `linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary))`
                          : `linear-gradient(135deg, rgba(var(--color-accent-primary-rgb),0.3), rgba(var(--color-accent-secondary-rgb),0.3))`
                      }}
                    />

                    {/* Inner Border */}
                    <div
                      className="absolute inset-0 rounded-3xl pointer-events-none border-2 transition-all duration-700"
                      style={{
                        borderColor: isActive
                          ? `var(--color-accent-primary)`
                          : `rgba(var(--color-accent-secondary-rgb),0.4)`,
                        boxShadow: isActive
                          ? `inset 0 0 30px rgba(var(--color-accent-primary-rgb),0.25), 0 0 40px rgba(var(--color-accent-primary-rgb),0.4)`
                          : 'none'
                      }}
                    />

                    {/* Content */}
                    <div className="relative bg-[var(--color-bg-elevated)]/80 backdrop-blur-md p-4 sm:p-6 rounded-3xl">
                      {/* Image Container */}
                      <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden mb-4 bg-[var(--color-bg-base)] flex items-center justify-center group">
                        {/* Background Blur */}
                        <div className="absolute inset-0 overflow-hidden">
                          <img
                            src={item.poster_url || ''}
                            alt=""
                            className="w-full h-full object-cover blur-2xl scale-150 opacity-20"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-base)] via-[var(--color-bg-base)]/50 to-transparent" />
                        </div>

                        {/* Main Image */}
                        <img
                          src={item.poster_url || ''}
                          alt={item.titulo}
                          className={`relative h-full w-auto max-w-full object-contain transition-all duration-700 ${
                            isActive ? 'scale-100' : 'scale-95'
                          }`}
                          style={{
                            filter: isActive
                              ? `drop-shadow(0 0 20px rgba(var(--color-accent-primary-rgb),0.6))`
                              : `drop-shadow(0 0 10px rgba(var(--color-accent-secondary-rgb),0.3))`
                          }}
                          loading="lazy"
                        />
                      </div>

                      {/* Info Section */}
                      <div className="text-center space-y-2">
                        <h3
                          className="font-black italic tracking-wider uppercase line-clamp-2 transition-all duration-700 text-sm sm:text-base"
                          style={{
                            color: isActive ? `var(--color-accent-primary)` : `rgba(var(--color-accent-secondary-rgb),0.7)`,
                            filter: isActive ? `drop-shadow(0 0 8px rgba(var(--color-accent-primary-rgb),0.5))` : 'none'
                          }}
                        >
                          {item.titulo}
                        </h3>

                      </div>
                    </div>
                  </div>
                </div>
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Back to Grid Button */}
      <button
        type="button"
        onClick={() => onViewModeChange?.('grid')}
        className="absolute bottom-35 right-0 z-20 rounded-full p-2.5 sm:p-3 transition-all duration-300"
        style={{
          background: `linear-gradient(135deg, rgba(var(--color-accent-secondary-rgb),0.3), rgba(var(--color-accent-secondary-rgb),0.1))`,
          border: `1px solid rgba(var(--color-accent-secondary-rgb),0.4)`,
          color: `var(--color-accent-secondary)`,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = `0 0 20px rgba(var(--color-accent-secondary-rgb),0.4)`
          e.currentTarget.style.borderColor = `var(--color-accent-secondary)`
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = 'none'
          e.currentTarget.style.borderColor = `rgba(var(--color-accent-secondary-rgb),0.4)`
        }}
        aria-label={t('buttons.back_to_grid')}
      >
        <Grid3x3 className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Navigation — Previous */}
      <button
        type="button"
        onClick={handlePrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 rounded-full p-3 sm:p-4 transition-all duration-300"
        style={{
          background: `linear-gradient(135deg, rgba(var(--color-accent-primary-rgb),0.3), rgba(var(--color-accent-primary-rgb),0.1))`,
          border: `1px solid rgba(var(--color-accent-primary-rgb),0.4)`,
          color: `var(--color-accent-primary)`,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = `0 0 20px rgba(var(--color-accent-primary-rgb),0.4)`
          e.currentTarget.style.borderColor = `var(--color-accent-primary)`
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = 'none'
          e.currentTarget.style.borderColor = `rgba(var(--color-accent-primary-rgb),0.4)`
        }}
        aria-label={t('buttons.previous')}
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Navigation — Next */}
      <button
        type="button"
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 rounded-full p-3 sm:p-4 transition-all duration-300"
        style={{
          background: `linear-gradient(135deg, rgba(var(--color-accent-primary-rgb),0.1), rgba(var(--color-accent-primary-rgb),0.3))`,
          border: `1px solid rgba(var(--color-accent-primary-rgb),0.4)`,
          color: `var(--color-accent-primary)`,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = `0 0 20px rgba(var(--color-accent-primary-rgb),0.4)`
          e.currentTarget.style.borderColor = `var(--color-accent-primary)`
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = 'none'
          e.currentTarget.style.borderColor = `rgba(var(--color-accent-primary-rgb),0.4)`
        }}
        aria-label={t('buttons.next')}
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Bottom Info - Active Item */}
      {activeItem && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-center z-10 max-w-md px-4">
          <p className="text-[var(--color-text-muted)] text-xs uppercase tracking-widest font-bold opacity-70">
            {isOwn ? t('own_item') : t('shared_item')}
          </p>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">
            {t('click_for_details')}
          </p>
        </div>
      )}

      {/* Stats - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 w-full bg-gradient-to-t from-[var(--color-bg-base)] via-[var(--color-bg-base)]/80 to-transparent px-4 md:px-6 py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
          <StatsWidget items={allItems} userOwnerId={userOwnerId} size="small" />
        </div>
      </div>
    </div>
  )
}

export default RingSlider
