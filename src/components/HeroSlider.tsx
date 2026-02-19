import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectCoverflow, Autoplay, Pagination } from 'swiper/modules'
import { ListItem } from '@/types'

// Swiper styles
import 'swiper/css'
import 'swiper/css/effect-coverflow'
import 'swiper/css/pagination'

interface HeroSliderProps {
  items: ListItem[]
}

const HeroSlider: React.FC<HeroSliderProps> = ({ items }) => {
  const itemsWithPoster = items.filter((item) => Boolean(item.poster_url))

  if (itemsWithPoster.length === 0) {
    return (
      <div className="w-full py-12 bg-black/20 backdrop-blur-sm border-y border-cyan-500/30 text-center">
        <p className="text-slate-400 text-sm">No hay imagenes disponibles.</p>
      </div>
    )
  }

  return (
    <div className="w-full py-12 bg-black/20 backdrop-blur-sm border-y border-cyan-500/30">
      <Swiper
        effect={'coverflow'}
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={'auto'}
        loop={true}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        coverflowEffect={{
          rotate: 30,
          stretch: 0,
          depth: 200,
          modifier: 1,
          slideShadows: true,
        }}
        modules={[EffectCoverflow, Autoplay, Pagination]}
        className="max-w-6xl"
      >
        {itemsWithPoster.map((item) => (
          <SwiperSlide key={item.id} className="w-[260px] sm:w-[320px]">
            <div className="relative group rounded-2xl border border-purple-500/60 bg-slate-900/60 shadow-[0_0_25px_rgba(168,85,247,0.35)] overflow-hidden">
              <div className="absolute inset-0">
                <img
                  src={item.poster_url || ''}
                  alt=""
                  className="w-full h-full object-cover blur-lg scale-110 opacity-40"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
              </div>

              <div className="relative p-4">
                <div className="h-[420px] w-full flex items-center justify-center">
                  <img
                    src={item.poster_url || ''}
                    alt={item.titulo}
                    className="h-full w-auto max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="mt-3">
                  <h3 className="text-cyan-300 font-bold italic tracking-wider uppercase line-clamp-2">
                    {item.titulo}
                  </h3>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}

export default HeroSlider