import React, { useRef, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectCoverflow } from 'swiper/modules'
import { ListItem } from '@/types'

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
  const itemsWithPoster = items.filter((item) => Boolean(item.poster_url))
  const swiperRef = useRef<any>(null)
  const [activeItemId, setActiveItemId] = useState<string>(itemsWithPoster[0]?.id || '')

  if (itemsWithPoster.length === 0) {
    return (
      <div className="w-full py-12 bg-black/20 backdrop-blur-sm border-y border-cyan-500/30 text-center">
        <p className="text-slate-400 text-sm">No hay imágenes disponibles.</p>
      </div>
    )
  }

  const handleSlideClick = (itemId: string) => {
    if (itemId === activeItemId) {
      // Click en slide central - abrir detalles
      const item = itemsWithPoster.find((i) => i.id === itemId)
      if (item) onOpenDetails(item)
    } else {
      // Click en slide lateral - ir al centro
      const slideIndex = itemsWithPoster.findIndex((i) => i.id === itemId)
      if (slideIndex !== -1) {
        swiperRef.current?.swiper.slideToLoop(slideIndex)
      }
    }
  }

  const handlePrevious = () => {
    swiperRef.current?.swiper.slidePrev()
  }

  const handleNext = () => {
    swiperRef.current?.swiper.slideNext()
  }

  const activeItem = itemsWithPoster.find((item) => item.id === activeItemId)
  const isOwn = activeItem?.user_id === userOwnerId

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div
          style={{
            backgroundImage: `linear-gradient(to right, #00ffff 1px, transparent 1px), linear-gradient(to bottom, #00ffff 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Radial Glow */}
      <div className="absolute inset-0 bg-radial-gradient from-purple-500/10 via-transparent to-transparent pointer-events-none" />

      <Swiper
        ref={swiperRef}
        effect={'coverflow'}
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={'auto'}
        loop={true}
        autoplay={false}
        coverflowEffect={{
          rotate: 45,
          stretch: 0,
          depth: 250,
          modifier: 1,
          slideShadows: false,
        }}
        modules={[EffectCoverflow]}
        className="w-full h-auto relative z-10"
        onSlideChange={(swiper) => {
          const currentSlide = itemsWithPoster[swiper.realIndex]
          if (currentSlide) {
            setActiveItemId(currentSlide.id)
          }
        }}
      >
        {itemsWithPoster.map((item) => (
          <SwiperSlide key={item.id} className="!w-[280px] sm:!w-[340px] lg:!w-[380px]">
            {({ isActive }) => (
              <div
                role="button"
                tabIndex={0}
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
                  {/* Animated Border */}
                  <div
                    className={`absolute -inset-1 rounded-3xl pointer-events-none transition-all duration-700 ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-100 blur-lg'
                        : 'bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 opacity-50 blur-sm'
                    }`}
                  />

                  {/* Inner Border */}
                  <div
                    className={`absolute inset-0 rounded-3xl pointer-events-none border-2 transition-all duration-700 ${
                      isActive
                        ? 'border-cyan-400 shadow-[inset_0_0_30px_rgba(0,255,255,0.3),0_0_40px_rgba(0,255,255,0.5)]'
                        : 'border-purple-500/40'
                    }`}
                  />

                  {/* Content */}
                  <div className="relative bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 rounded-3xl">
                    {/* Image Container */}
                    <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden mb-4 bg-slate-900 flex items-center justify-center group">
                      {/* Background Blur */}
                      <div className="absolute inset-0 overflow-hidden">
                        <img
                          src={item.poster_url || ''}
                          alt=""
                          className="w-full h-full object-cover blur-2xl scale-150 opacity-20"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                      </div>

                      {/* Main Image */}
                      <img
                        src={item.poster_url || ''}
                        alt={item.titulo}
                        className={`relative h-full w-auto max-w-full object-contain transition-all duration-700 ${
                          isActive
                            ? 'drop-shadow-[0_0_30px_rgba(0,255,255,0.6)] scale-100'
                            : 'drop-shadow-[0_0_15px_rgba(168,85,247,0.3)] scale-95'
                        }`}
                        loading="lazy"
                      />
                    </div>

                    {/* Info Section */}
                    <div className="text-center space-y-2">
                      <h3
                        className={`font-black italic tracking-wider uppercase line-clamp-2 transition-all duration-700 text-sm sm:text-base ${
                          isActive
                            ? 'text-cyan-300 drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]'
                            : 'text-purple-300/70'
                        }`}
                      >
                        {item.titulo}
                      </h3>

                      <div className="flex gap-2 justify-center flex-wrap">
                        <span
                          className={`text-[9px] font-black uppercase tracking-[0.15em] px-2 py-1 rounded-full border transition-all duration-700 ${
                            isActive
                              ? 'border-cyan-400 text-cyan-300 bg-cyan-500/15 shadow-[0_0_15px_rgba(0,255,255,0.4)]'
                              : 'border-purple-500/30 text-purple-300/60'
                          }`}
                        >
                          {item.tipo === 'pelicula' ? '🎬 Film' : '📺 Series'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Back to Grid Button */}
      <button
        type="button"
        onClick={() => onViewModeChange?.('grid')}
        className="absolute bottom-32 right-6 z-20 bg-gradient-to-r from-pink-500/30 to-pink-500/10 hover:from-pink-500/50 hover:to-pink-500/30 border border-pink-400/40 hover:border-pink-400/80 text-pink-300 hover:text-pink-200 rounded-full p-2.5 sm:p-3 transition-all duration-300 hover:shadow-[0_0_20px_rgba(236,72,153,0.4)]"
        aria-label="Volver a rejilla"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6h12M6 12h12M6 18h12" />
        </svg>
      </button>

      {/* Navigation Buttons */}
      <button
        type="button"
        onClick={handlePrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-r from-cyan-500/30 to-cyan-500/10 hover:from-cyan-500/50 hover:to-cyan-500/30 border border-cyan-400/40 hover:border-cyan-400/80 text-cyan-300 hover:text-cyan-200 rounded-full p-3 sm:p-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,255,0.4)]"
        aria-label="Anterior"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        type="button"
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-r from-cyan-500/10 to-cyan-500/30 hover:from-cyan-500/30 hover:to-cyan-500/50 border border-cyan-400/40 hover:border-cyan-400/80 text-cyan-300 hover:text-cyan-200 rounded-full p-3 sm:p-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,255,0.4)]"
        aria-label="Siguiente"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Bottom Info - Active Item */}
      {activeItem && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-center z-10 max-w-md px-4">
          <p className="text-slate-400 text-xs uppercase tracking-widest font-bold opacity-70">
            {isOwn ? 'Tus película' : 'Película compartida'}
          </p>
          <p className="text-slate-300 text-sm mt-1">
            Haz clic para ver detalles
          </p>
        </div>
      )}

      {/* Stats - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 w-full bg-gradient-to-t from-black via-black/80 to-transparent px-4 md:px-6 py-6 md:py-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-center">
          <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 rounded-lg p-3 md:p-4">
            <div className="text-lg md:text-xl font-black text-cyan-400">{allItems.length}</div>
            <div className="text-[10px] md:text-xs text-slate-400 uppercase font-bold">Total</div>
          </div>
          <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-lg p-3 md:p-4">
            <div className="text-lg md:text-xl font-black text-green-400">
              {allItems.filter((i) => i.visto).length}
            </div>
            <div className="text-[10px] md:text-xs text-slate-400 uppercase font-bold">Vistas</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-lg p-3 md:p-4">
            <div className="text-lg md:text-xl font-black text-purple-400">
              {allItems.filter((i) => !i.visto).length}
            </div>
            <div className="text-[10px] md:text-xs text-slate-400 uppercase font-bold">Pendientes</div>
          </div>
          <div className="bg-gradient-to-br from-pink-500/10 to-pink-500/5 border border-pink-500/20 rounded-lg p-3 md:p-4">
            <div className="text-lg md:text-xl font-black text-pink-400">
              {allItems.filter((i) => i.user_id === userOwnerId).length}
            </div>
            <div className="text-[10px] md:text-xs text-slate-400 uppercase font-bold">Propias</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RingSlider
