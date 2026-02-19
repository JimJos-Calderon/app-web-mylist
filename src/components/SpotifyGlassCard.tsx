import React, { useState } from 'react'
import { motion } from 'framer-motion'

interface SpotifyGlassCardProps {
  spotifyUrl: string
  accentColor?: string
  isDragging?: boolean
}

const SpotifyGlassCard: React.FC<SpotifyGlassCardProps> = ({
  spotifyUrl,
  accentColor = 'rgb(168, 85, 247)',
  isDragging = false
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative group"
      style={{
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      {/* Glow effect behind */}
      <div
        className="absolute inset-0 rounded-2xl blur-xl opacity-40 -z-10"
        style={{
          backgroundColor: accentColor,
          filter: `blur(24px)`
        }}
      />

      {/* Glassmorphism container */}
      <div className="relative backdrop-blur-lg bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/20 overflow-hidden shadow-2xl"
        style={{
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            0 0 20px rgba(0, 0, 0, 0.2)
          `
        }}
      >
        {/* Padding container for iframe */}
        <div className="p-1 bg-gradient-to-br from-white/5 to-transparent">
          <iframe
            data-testid="spotify-embed-iframe"
            style={{
              borderRadius: '16px',
              display: 'block',
              pointerEvents: isDragging ? 'none' : 'auto'
            }}
            src={spotifyUrl}
            width="100%"
            height="352"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>
      </div>
    </motion.div>
  )
}

export default SpotifyGlassCard
