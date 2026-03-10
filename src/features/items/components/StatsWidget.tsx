import React from 'react'
import { useTranslation } from 'react-i18next'
import { ListItem } from '@/features/shared'

interface StatsWidgetProps {
  items: ListItem[]
  userOwnerId?: string
  size?: 'small' | 'large' // small: text-lg, large: text-xl
}

const StatsWidget: React.FC<StatsWidgetProps> = ({ items, userOwnerId, size = 'small' }) => {
  const { t } = useTranslation()
  const textSize = size === 'large' ? 'md:text-2xl' : 'md:text-xl'

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-center">
      <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 rounded-lg p-3 md:p-4">
        <div className={`text-lg ${textSize} font-black text-cyan-400`}>{items.length}</div>
        <div className="text-[10px] md:text-xs text-slate-400 uppercase font-bold">{t('stats.total')}</div>
      </div>
      <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-lg p-3 md:p-4">
        <div className={`text-lg ${textSize} font-black text-green-400`}>
          {items.filter((i) => i.visto).length}
        </div>
        <div className="text-[10px] md:text-xs text-slate-400 uppercase font-bold">{t('stats.watched')}</div>
      </div>
      <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-lg p-3 md:p-4">
        <div className={`text-lg ${textSize} font-black text-purple-400`}>
          {items.filter((i) => !i.visto).length}
        </div>
        <div className="text-[10px] md:text-xs text-slate-400 uppercase font-bold">{t('stats.pending')}</div>
      </div>
      <div className="bg-gradient-to-br from-pink-500/10 to-pink-500/5 border border-pink-500/20 rounded-lg p-3 md:p-4">
        <div className={`text-lg ${textSize} font-black text-pink-400`}>
          {items.filter((i) => i.user_id === userOwnerId).length}
        </div>
        <div className="text-[10px] md:text-xs text-slate-400 uppercase font-bold">{t('stats.own')}</div>
      </div>
    </div>
  )
}

export default StatsWidget
