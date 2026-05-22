import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'

/** Duración total de salida (fade + road runner + quickScale), alineada con el CSS “Meep Meep”. */
export const RETRO_MEEP_EXIT_DURATION_MS = 520

export type RetroMeepModalFrameHandle = {
  /** Ejecuta comprobaciones opcionales y cierra (con animación solo en tema retro si aplica). */
  tryBeginClose: () => void
}

export type RetroMeepModalFrameVariant = 'stacked' | 'split'

type RetroMeepModalFrameProps = {
  /** Tema retro cartoon: activa animación tipo “Meep Meep” (respeta prefers-reduced-motion). */
  meep: boolean
  variant: RetroMeepModalFrameVariant
  onRequestClose: () => void
  /** Si devuelve false, se cancela el cierre (p. ej. submodal abierta). */
  onBeforeClose?: () => boolean
  rootClassName: string
  /** variant stacked y sin meep: fondo y blur en el contenedor raíz */
  stackedFillClassName?: string
  /** variant split y sin meep: capa absoluta detrás del panel */
  splitOverlayClassName?: string
  panelClassName: string
  panelProps?: Omit<React.HTMLAttributes<HTMLDivElement>, 'className' | 'children'>
  closeOnEscape?: boolean
  children: React.ReactNode
} & Pick<
  React.HTMLAttributes<HTMLDivElement>,
  'role' | 'aria-modal' | 'aria-labelledby' | 'aria-describedby' | 'aria-label' | 'onKeyDown' | 'tabIndex'
>

const joinClass = (...parts: Array<string | undefined | false>) => parts.filter(Boolean).join(' ')

export const RetroMeepModalFrame = forwardRef<RetroMeepModalFrameHandle, RetroMeepModalFrameProps>(
  function RetroMeepModalFrame(
    {
      meep,
      variant,
      onRequestClose,
      onBeforeClose,
      rootClassName,
      stackedFillClassName,
      splitOverlayClassName,
      panelClassName,
      panelProps,
      closeOnEscape = false,
      children,
      role,
      'aria-modal': ariaModal,
      'aria-labelledby': ariaLabelledby,
      'aria-describedby': ariaDescribedby,
      'aria-label': ariaLabel,
      onKeyDown,
      tabIndex,
    },
    ref,
  ) {
    const reducedMotion = useReducedMotion()
    const meepActive = Boolean(meep && !reducedMotion)
    const [leaving, setLeaving] = useState(false)
    const leavingRef = useRef(false)
    const closeTimerRef = useRef<number | null>(null)

    const clearCloseTimer = useCallback(() => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
    }, [])

    useEffect(() => () => clearCloseTimer(), [clearCloseTimer])

    const tryBeginClose = useCallback(() => {
      if (onBeforeClose && !onBeforeClose()) return

      if (!meepActive) {
        onRequestClose()
        return
      }

      if (leavingRef.current) return
      leavingRef.current = true
      setLeaving(true)
      clearCloseTimer()
      closeTimerRef.current = window.setTimeout(() => {
        onRequestClose()
        leavingRef.current = false
        setLeaving(false)
        closeTimerRef.current = null
      }, RETRO_MEEP_EXIT_DURATION_MS)
    }, [clearCloseTimer, meepActive, onBeforeClose, onRequestClose])

    useImperativeHandle(ref, () => ({ tryBeginClose }), [tryBeginClose])

    useEffect(() => {
      if (!closeOnEscape) return

      const onEscape = (event: KeyboardEvent) => {
        if (event.key !== 'Escape') return
        event.preventDefault()
        tryBeginClose()
      }

      window.addEventListener('keydown', onEscape)
      return () => window.removeEventListener('keydown', onEscape)
    }, [closeOnEscape, tryBeginClose])

    const {
      onClick: panelOnClick,
      className: _ignoredPanelClass,
      ...restPanelProps
    } = panelProps ?? {}

    const handlePanelClick = (event: React.MouseEvent<HTMLDivElement>) => {
      panelOnClick?.(event)
      event.stopPropagation()
    }

    const rootA11y = {
      role,
      'aria-modal': ariaModal,
      'aria-labelledby': ariaLabelledby,
      'aria-describedby': ariaDescribedby,
      'aria-label': ariaLabel,
      onKeyDown,
      tabIndex,
    }

    const panelClasses = joinClass(meepActive ? 'retro-modal-meep__panel' : undefined, panelClassName)

    if (!meepActive) {
      if (variant === 'split') {
        return (
          <div className={rootClassName} {...rootA11y}>
            <div className={splitOverlayClassName} onClick={tryBeginClose} />
            <div className={panelClasses} {...restPanelProps} onClick={handlePanelClick}>
              {children}
            </div>
          </div>
        )
      }

      return (
        <div
          className={joinClass(rootClassName, stackedFillClassName)}
          onClick={tryBeginClose}
          {...rootA11y}
        >
          <div className={panelClasses} {...restPanelProps} onClick={handlePanelClick}>
            {children}
          </div>
        </div>
      )
    }

    const meepRoot = joinClass('retro-modal-meep', leaving && 'retro-modal-meep--out', rootClassName)

    if (variant === 'split') {
      return (
        <div className={meepRoot} {...rootA11y}>
          <div className="retro-modal-meep__backdrop" onClick={tryBeginClose}>
            <div className={panelClasses} {...restPanelProps} onClick={handlePanelClick}>
              {children}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className={meepRoot} {...rootA11y}>
        <div className="retro-modal-meep__backdrop" onClick={tryBeginClose}>
          <div className={panelClasses} {...restPanelProps} onClick={handlePanelClick}>
            {children}
          </div>
        </div>
      </div>
    )
  },
)
