import React from 'react'

interface TechBackgroundProps {
  className?: string
}

const TechBackground: React.FC<TechBackgroundProps> = ({ className = '' }) => {
  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 -z-10 overflow-hidden pointer-events-none ${className}`}
    >
      <div className="absolute inset-0 tech-grid-overlay" />
      <div className="absolute inset-0 tech-grid-vignette" />

      <div className="absolute inset-0 tech-scanline-overlay">
        <div className="tech-scanline-line" />
      </div>
    </div>
  )
}

export default TechBackground
