import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw, Play } from 'lucide-react'
import { OptimizedImage, TechLabel } from '@/features/shared'
import type { ListItem } from '@/features/shared'

interface RandomWinnerContentProps {
  item: ListItem
  pool: ListItem[]
  onReRoll: () => void
  onClose: () => void
}

type AnimationPhase = 'idle' | 'spinning' | 'stabilizing' | 'finished'

const RandomWinnerContent: React.FC<RandomWinnerContentProps> = ({ item, pool, onReRoll, onClose }) => {
  const { t } = useTranslation()
  const [phase, setPhase] = useState<AnimationPhase>('idle')
  const [showCleanCard, setShowCleanCard] = useState(false)

  // Detectar si el usuario prefiere movimiento reducido
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Crear un pool visual para el efecto de scroll vertical
  const visualPool = useMemo(() => {
    // Mezclamos el pool para que no se vea igual siempre
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    
    // Necesitamos suficientes elementos para que el scroll sea largo y rápido
    const itemsNeeded = 40
    const repeated = []
    while (repeated.length < itemsNeeded) {
      repeated.push(...shuffled)
    }
    
    // El pool final: empezamos en idle (item 0), giramos por el medio, terminamos en el 'item' real al final.
    return [...repeated.slice(0, itemsNeeded), item]
  }, [pool, item])

  useEffect(() => {
    if (prefersReducedMotion) {
      setPhase('finished')
      setShowCleanCard(true)
      return
    }

    // Reiniciar estados
    setPhase('idle')
    setShowCleanCard(false)

    // Iniciamos la secuencia de animación con un pequeño respiro para que el navegador registre el 'idle'
    const startTimer = setTimeout(() => {
      setPhase('spinning')
    }, 50)

    const spinDuration = 1800 // Un poco más largo para que se note
    const stabilizeDuration = 800

    const spinningTimer = setTimeout(() => {
      setPhase('stabilizing')
    }, startTimer + spinDuration)

    const finishedTimer = setTimeout(() => {
      setPhase('finished')
      // El flash ocurre justo cuando se detiene
      setTimeout(() => setShowCleanCard(true), 150)
    }, startTimer + spinDuration + stabilizeDuration)

    return () => {
      clearTimeout(startTimer)
      clearTimeout(spinningTimer)
      clearTimeout(finishedTimer)
    }
  }, [item, prefersReducedMotion])

  const isIdle = phase === 'idle'
  const isSpinning = phase === 'spinning'
  const isStabilizing = phase === 'stabilizing'
  const isFinished = phase === 'finished'

  // Calculamos el offset de transformación basado en la fase
  let translateY = '0%'
  if (isSpinning) translateY = `-${(visualPool.length - 5) * 100}%`
  if (isStabilizing || isFinished) translateY = `-${(visualPool.length - 1) * 100}%`

  return (
    <div className="flex flex-col items-center gap-6 p-2 md:p-6 overflow-hidden w-full">
      {/* ─── TERMINAL DISPLAY ─── */}
      <div className="relative w-full max-w-[280px] aspect-[2/3] overflow-hidden rounded-2xl border-2 border-[rgba(var(--color-accent-primary-rgb),0.3)] shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-black">
        
        {/* Overlays de Glitch (Solo durante la animación) */}
        {!showCleanCard && !isIdle && (
          <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.04),rgba(0,255,0,0.02),rgba(0,0,255,0.04))] bg-[length:100%_3px,2px_100%]" />
            <div className={`absolute inset-0 opacity-40 bg-white/5 ${isSpinning ? 'animate-glitch-noise' : ''}`} />
          </div>
        )}

        {/* ─── TIRA DE POSTERS (ANIMACIÓN VERTICAL) ─── */}
        <div 
          className={`w-full h-full flex flex-col will-change-transform ${
            isSpinning ? 'transition-transform duration-[1800ms] ease-in' : 
            isStabilizing ? 'transition-transform duration-[800ms] ease-out' : 
            'transition-none'
          }`}
          style={{ transform: `translateY(${translateY})` }}
        >
          {visualPool.map((p, idx) => (
            <div key={`${p.id}-${idx}`} className="relative w-full h-full flex-shrink-0">
               <div className={`w-full h-full transition-all duration-300 ${isSpinning ? 'scale-110 brightness-125 saturate-150' : ''}`}>
                <OptimizedImage
                  src={p.poster_url ?? undefined}
                  alt={p.titulo}
                  className="h-full w-full object-cover opacity-90"
                />
              </div>
              
              {/* Caracteres binarios flotantes */}
              {(isSpinning || isStabilizing) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
                  <span className="font-mono text-[10px] text-[var(--color-accent-primary)] font-black tracking-widest break-all opacity-60">
                    {Array.from({ length: 80 }).map(() => (Math.random() > 0.5 ? '1' : '0')).join('')}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ─── REVELACIÓN FINAL ─── */}
        {isFinished && (
          <div 
            className={`absolute inset-0 z-30 flex flex-col items-center justify-end bg-black transition-all duration-500 ease-out ${
              showCleanCard ? 'opacity-100 scale-100' : 'opacity-0 scale-110 blur-xl'
            }`}
          >
            {/* Marco de Neón Pulsante */}
            <div className="absolute inset-0 border-[6px] border-accent-primary animate-neon-pulse shadow-[inset_0_0_30px_rgba(var(--color-accent-primary-rgb),0.5)] z-10 pointer-events-none" />
            
            <OptimizedImage
              src={item.poster_url ?? undefined}
              alt={item.titulo}
              className="h-full w-full object-cover"
            />
            
            <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black via-black/90 to-transparent p-5">
              <TechLabel
                text={item.tipo === 'pelicula' ? 'DATA_LNK.FILM' : 'DATA_LNK.SERIE'}
                tone="primary"
                blink
                className="mb-2"
              />
              <h3 className="text-2xl font-black uppercase tracking-tight text-white leading-tight drop-shadow-[0_0_15px_rgba(0,0,0,1)]">
                {item.titulo}
              </h3>
            </div>

            {/* Strobe Effect Flash */}
            <div className={`absolute inset-0 z-40 bg-white opacity-0 ${showCleanCard ? 'animate-strobe-flash' : ''} pointer-events-none`} />
          </div>
        )}
      </div>

      {/* ─── ACCIONES ─── */}
      <div className={`flex w-full max-w-sm flex-col gap-3 transition-all duration-700 ${isFinished ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'}`}>
        <button
          type="button"
          onClick={onClose}
          className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-accent-primary bg-accent-primary/10 py-4 font-mono text-sm font-black uppercase tracking-widest text-accent-primary transition hover:bg-accent-primary hover:text-black active:scale-95 shadow-[0_0_20px_rgba(var(--color-accent-primary-rgb),0.2)]"
        >
          <Play className="h-5 w-5 fill-current" />
          <span>{'>'} EXEC.VIEW_DETAILS</span>
          <div className="absolute inset-0 -translate-y-full bg-gradient-to-b from-transparent via-white/10 to-transparent group-hover:animate-scan-hover pointer-events-none" />
        </button>

        <button
          type="button"
          onClick={onReRoll}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-black/40 py-4 font-mono text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] transition hover:border-white/30 hover:text-white active:scale-95"
        >
          <RefreshCw className="h-4 w-4" />
          {t('action.roll_again', 'SYSTEM_RETRY.EXE')}
        </button>
      </div>

      <style>{`
        @keyframes glitch-noise {
          0%, 100% { transform: translate(0,0); }
          10% { transform: translate(-2px,-2px) skewX(2deg); filter: hue-rotate(90deg); }
          20% { transform: translate(2px,2px) scaleY(1.1); }
          40% { transform: translate(-2px,2px) invert(0.05); }
          60% { transform: translate(2px,-2px) brightness(1.8); }
          80% { transform: translate(-1px,-1px) skewX(-2deg); }
        }

        @keyframes neon-pulse {
          0%, 100% { border-color: rgba(var(--color-accent-primary-rgb), 0.4); box-shadow: 0 0 10px rgba(var(--color-accent-primary-rgb), 0.2), inset 0 0 10px rgba(var(--color-accent-primary-rgb), 0.1); }
          50% { border-color: rgba(var(--color-accent-primary-rgb), 1); box-shadow: 0 0 30px rgba(var(--color-accent-primary-rgb), 0.6), inset 0 0 20px rgba(var(--color-accent-primary-rgb), 0.3); }
        }

        @keyframes strobe-flash {
          0% { opacity: 0; }
          15% { opacity: 0.8; }
          30% { opacity: 0; }
          45% { opacity: 0.6; }
          60% { opacity: 0; }
          100% { opacity: 0; }
        }

        @keyframes scan-hover {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }

        .animate-glitch-noise {
          animation: glitch-noise 0.25s infinite linear;
          background: repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 2px);
        }

        .animate-neon-pulse {
          animation: neon-pulse 1.2s infinite ease-in-out;
        }

        .animate-strobe-flash {
          animation: strobe-flash 0.4s ease-out forwards;
        }

        .animate-scan-hover {
          animation: scan-hover 0.6s ease-out;
        }
      `}</style>
    </div>
  )
}

export default RandomWinnerContent
