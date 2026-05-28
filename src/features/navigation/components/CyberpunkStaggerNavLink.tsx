import React, { useCallback, useEffect, useRef } from 'react'
import { NavLink, useMatch, useResolvedPath } from 'react-router-dom'
import gsap from 'gsap'
import { useReducedMotion } from '@/features/shared'
import {
  CYBERPUNK_STAGGER_STRIPE_YS,
  runCyberpunkStaggerNavSweep,
  startCyberpunkStaggerNavFlicker,
  stopCyberpunkStaggerNavFlicker,
} from '../utils/cyberpunkStaggerNavEffect'

interface CyberpunkStaggerNavLinkProps {
  to: string
  children: React.ReactNode
  end?: boolean
}

const CyberpunkStaggerNavLink: React.FC<CyberpunkStaggerNavLinkProps> = ({ to, children, end = true }) => {
  const groupRef = useRef<HTMLDivElement>(null)
  const wasActiveRef = useRef(false)
  const flickerTweensRef = useRef<gsap.core.Tween[]>([])
  const isHoveringRef = useRef(false)
  const reducedMotion = useReducedMotion()
  const resolved = useResolvedPath(to)
  const match = useMatch({ path: resolved.pathname, end })
  const isActive = Boolean(match)

  useEffect(() => {
    const container = groupRef.current
    if (!container || reducedMotion) return

    if (isActive !== wasActiveRef.current) {
      runCyberpunkStaggerNavSweep(container, isActive)
      wasActiveRef.current = isActive
    }
  }, [isActive, reducedMotion])

  const handlePointerEnter = useCallback(() => {
    if (reducedMotion) return
    const container = groupRef.current
    if (!container) return
    isHoveringRef.current = true
    startCyberpunkStaggerNavFlicker(container, flickerTweensRef.current)
  }, [reducedMotion])

  const handlePointerLeave = useCallback(() => {
    const container = groupRef.current
    if (!container) return
    isHoveringRef.current = false
    stopCyberpunkStaggerNavFlicker(container, flickerTweensRef.current, isActive)
  }, [isActive])

  useEffect(() => {
    if (!isHoveringRef.current) return
    const container = groupRef.current
    if (!container || reducedMotion) return
    stopCyberpunkStaggerNavFlicker(container, flickerTweensRef.current, isActive)
    startCyberpunkStaggerNavFlicker(container, flickerTweensRef.current)
  }, [isActive, reducedMotion])

  useEffect(() => {
    return () => {
      flickerTweensRef.current.forEach((tween) => tween.kill())
      flickerTweensRef.current = []
    }
  }, [])

  return (
    <div ref={groupRef} className="cyberpunk-stagger-nav">
      <NavLink
        to={to}
        end={end}
        className={`cyberpunk-stagger-nav__label theme-heading-font uppercase${
          isActive ? ' cyberpunk-stagger-nav__label--active' : ''
        }`}
        onMouseEnter={handlePointerEnter}
        onMouseLeave={handlePointerLeave}
        onFocus={handlePointerEnter}
        onBlur={handlePointerLeave}
      >
        <span>{children}</span>
        <svg
          className="cyberpunk-stagger-nav__svg"
          height="100%"
          width="100%"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <g className="cyberpunk-stagger-nav__stripes">
            {CYBERPUNK_STAGGER_STRIPE_YS.map((y) => (
              <rect key={y} x="-100%" y={y} width="100%" height="2" />
            ))}
          </g>
        </svg>
      </NavLink>
    </div>
  )
}

export default CyberpunkStaggerNavLink
