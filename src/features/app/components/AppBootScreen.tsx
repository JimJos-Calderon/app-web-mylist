import React from 'react'

const AppBootScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center relative">
          <div className="w-20 h-20 border-2 border-[rgba(var(--color-accent-primary-rgb),0.2)] border-t-accent-primary border-r-[var(--color-accent-secondary)] rounded-full animate-spin" />
          <div className="absolute inset-0 border-2 border-[rgba(var(--color-accent-secondary-rgb),0.1)] border-b-[var(--color-accent-secondary)] rounded-full animate-[spin_3s_linear_infinite_reverse]" />
        </div>

        <div className="space-y-2">
          <p className="text-accent-primary font-mono font-bold text-lg uppercase tracking-[0.2em] animate-pulse">
            SYS.INIT_SEQUENCE...
          </p>

          <p className="text-[var(--color-text-muted)] font-mono text-xs uppercase opacity-70">
            {'>'} AUTH_CHECK_PENDING
          </p>
        </div>
      </div>
    </div>
  )
}

export default AppBootScreen