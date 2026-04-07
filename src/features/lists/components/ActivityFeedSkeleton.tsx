import React from 'react'
import HudContainer from '../../shared/components/HudContainer'
import TechLabel from '../../shared/components/TechLabel'
import { MessageCircleMore } from 'lucide-react'

export type ActivityFeedSkeletonTheme = 'cyberpunk' | 'terminal' | 'retro-cartoon' | 'default'

interface ActivityFeedSkeletonProps {
  headerLabel: string
  theme: ActivityFeedSkeletonTheme
  rows?: number
  className?: string
}

const rowPulse = 'animate-pulse rounded bg-[rgba(var(--color-text-muted-rgb),0.15)]'

const ActivityFeedSkeleton: React.FC<ActivityFeedSkeletonProps> = ({
  headerLabel,
  theme,
  rows = 5,
  className,
}) => {
  const retro = theme === 'retro-cartoon'
  const cyber = theme === 'cyberpunk'
  const term = theme === 'terminal'

  const borderClass = retro
    ? 'border-black'
    : cyber
      ? 'border-cyan-500/30'
      : term
        ? 'border-green-500/25'
        : 'border-[rgba(var(--color-accent-primary-rgb),0.2)]'

  return (
    <HudContainer className={`p-4 ${className || ''}`}>
      <header className={`mb-4 flex items-center gap-2 border-b pb-2 ${borderClass}`}>
        <MessageCircleMore className="h-4 w-4 text-accent-primary opacity-60" />
        <TechLabel text={headerLabel} blink />
      </header>

      <div className="custom-scrollbar max-h-[320px] space-y-3 overflow-y-auto pr-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className={`flex gap-3 rounded-2xl border p-3 ${borderClass} ${
              retro ? 'bg-[var(--color-bg-primary)] shadow-[4px_4px_0px_0px_#000000]' : cyber ? 'bg-black/50' : term ? 'bg-black/80' : 'bg-[rgba(0,0,0,0.2)]'
            }`}
          >
            <div className={`h-11 w-11 shrink-0 rounded-full ${rowPulse}`} />
            <div className="min-w-0 flex-1 space-y-2">
              <div className={`h-3 w-24 ${rowPulse}`} />
              <div className={`h-3 w-full max-w-[90%] ${rowPulse}`} />
              <div className={`h-3 w-full max-w-[70%] ${rowPulse}`} />
              <div className="mt-2 flex gap-2">
                <div className={`h-5 w-16 rounded-full ${rowPulse}`} />
                <div className={`h-5 w-20 rounded-full ${rowPulse}`} />
              </div>
            </div>
            <div className={`hidden h-[60px] w-10 shrink-0 sm:block ${rowPulse}`} />
          </div>
        ))}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(var(--color-accent-primary-rgb), 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(var(--color-accent-primary-rgb), 0.5);
        }
      `}</style>
    </HudContainer>
  )
}

export default ActivityFeedSkeleton
