import React from 'react'
import { useTranslation } from 'react-i18next'
import { HudContainer, ListItem, TechLabel } from '@/features/shared'

interface StatsWidgetProps {
  items: ListItem[]
  userOwnerId?: string
  size?: 'small' | 'large' // small: text-lg, large: text-xl
}

const StatsWidget: React.FC<StatsWidgetProps> = ({ items, userOwnerId, size = 'small' }) => {
  const { t } = useTranslation()
  const textSize = size === 'large' ? 'md:text-2xl' : 'md:text-xl'

  const watchedCount = items.filter((i) => i.visto).length
  const pendingCount = items.filter((i) => !i.visto).length
  const ownCount = items.filter((i) => i.user_id === userOwnerId).length

  return (
    <HudContainer contentClassName="relative p-4 md:p-5">
      <TechLabel
        text="SYS.READY"
        tone="secondary"
        blink
        className="absolute top-2 right-2"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-center">
        <div className="hud-metric-card hud-metric-card--primary p-3 md:p-4">
          <div className={`text-lg ${textSize} font-black hud-metric-value hud-metric-value--primary`}>
            {items.length}
          </div>
          <div className="text-[10px] md:text-xs uppercase font-bold hud-metric-label">{t('stats.total')}</div>
        </div>

        <div className="hud-metric-card hud-metric-card--secondary p-3 md:p-4">
          <div className={`text-lg ${textSize} font-black hud-metric-value hud-metric-value--secondary`}>
            {watchedCount}
          </div>
          <div className="text-[10px] md:text-xs uppercase font-bold hud-metric-label">{t('stats.watched')}</div>
        </div>

        <div className="hud-metric-card hud-metric-card--primary p-3 md:p-4">
          <div className={`text-lg ${textSize} font-black hud-metric-value hud-metric-value--primary`}>
            {pendingCount}
          </div>
          <div className="text-[10px] md:text-xs uppercase font-bold hud-metric-label">{t('stats.pending')}</div>
        </div>

        <div className="hud-metric-card hud-metric-card--secondary p-3 md:p-4">
          <div className={`text-lg ${textSize} font-black hud-metric-value hud-metric-value--secondary`}>
            {ownCount}
          </div>
          <div className="text-[10px] md:text-xs uppercase font-bold hud-metric-label">{t('stats.own')}</div>
        </div>
      </div>
    </HudContainer>
  )
}

export default StatsWidget
