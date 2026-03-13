import React from 'react'

interface HudContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  contentClassName?: string
  showDecorations?: boolean
}

const HudContainer: React.FC<HudContainerProps> = ({
  children,
  className = '',
  contentClassName = '',
  showDecorations = true,
  ...rest
}) => {
  return (
    <div className={`hud-container backdrop-blur-md ${className}`} {...rest}>
      {showDecorations && (
        <>
          <span aria-hidden="true" className="hud-corner hud-corner--tl" />
          <span aria-hidden="true" className="hud-corner hud-corner--tr" />
          <span aria-hidden="true" className="hud-corner hud-corner--bl" />
          <span aria-hidden="true" className="hud-corner hud-corner--br" />

          <span aria-hidden="true" className="hud-cross hud-cross--tr" />
          <span aria-hidden="true" className="hud-cross hud-cross--bl" />
        </>
      )}

      <div className={`relative z-[1] ${contentClassName}`}>
        {children}
      </div>
    </div>
  )
}

export default HudContainer
