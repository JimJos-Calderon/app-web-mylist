import React from 'react'

interface BrutalistCardProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  accent?: 'green' | 'cyan' | 'white' | 'none'
  className?: string
  headerAction?: React.ReactNode
}

const BrutalistCard: React.FC<BrutalistCardProps> = ({
  children,
  title,
  subtitle,
  accent = 'none',
  className = '',
  headerAction,
}) => {
  const accentColors = {
    green: '#00FF41',
    cyan: '#00FFFF',
    white: '#FFFFFF',
    none: 'transparent',
  }

  const accentColor = accentColors[accent]
  const hasAccent = accent !== 'none'

  return (
    <div
      className={`group relative h-full w-full bg-zinc-950 border-2 border-white/10 transition-all duration-300 hover:translate-x-[-2px] hover:translate-y-[-2px] ${
        hasAccent ? '' : 'hover:border-white/30'
      } ${className}`}
      style={{
        boxShadow: hasAccent ? `4px 4px 0px 0px ${accentColor}` : 'none',
        // Efecto hover para la sombra
        ...(hasAccent && {
          '--hover-shadow': `6px 6px 0px 0px ${accentColor}`,
        } as any),
      }}
    >
      {/* Header */}
      {(title || subtitle || headerAction) && (
        <div className="flex items-center justify-between border-b-2 border-white/5 p-4 md:p-5">
          <div>
            {subtitle && (
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)] opacity-70">
                {'>'} {subtitle}
              </p>
            )}
            {title && (
              <h3 className="font-mono text-sm font-black uppercase tracking-widest text-white md:text-base">
                {title}
              </h3>
            )}
          </div>
          {headerAction && <div className="flex items-center gap-2">{headerAction}</div>}
        </div>
      )}

      {/* Content */}
      <div className="p-4 md:p-6">{children}</div>

      {/* Retro corner detail */}
      <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-white/20" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-white/20" />
    </div>
  )
}

export default BrutalistCard
