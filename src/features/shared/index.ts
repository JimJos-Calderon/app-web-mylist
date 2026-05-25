export { default as ConfirmDialog } from './components/ConfirmDialog'
export {
  RetroMeepModalFrame,
  RETRO_MEEP_EXIT_DURATION_MS,
  type RetroMeepModalFrameHandle,
  type RetroMeepModalFrameVariant,
} from './components/RetroMeepModalFrame'
export { default as ErrorAlert } from './components/ErrorAlert'
export { GlobalErrorFallback } from './components/GlobalErrorFallback'
export { InstallPwaPrompt } from './components/InstallPwaPrompt'
export { LanguageSwitcher } from './components/LanguageSwitcher'
export { default as OptimizedImage } from './components/OptimizedImage'
export { SectionErrorFallback } from './components/SectionErrorFallback'

export { default as ThemeSwitcher } from './components/ThemeSwitcher'
export { default as TechBackground } from './components/TechBackground'
export { default as CyberpunkLinesBackground } from './components/CyberpunkLinesBackground'
export { default as TerminalMatrixBackground } from './components/TerminalMatrixBackground'
export { default as HudContainer } from './components/HudContainer'
export { default as TechLabel } from './components/TechLabel'
export { default as ItemGroupWatchBadge } from './components/ItemGroupWatchBadge'

export { useReducedMotion } from './hooks/useReducedMotion'
export { useMediaQuery } from './hooks/useMediaQuery'
export { usePushNotifications } from './hooks/usePushNotifications'
export { useTheme } from './hooks/useTheme'
export type { ThemePreference } from './hooks/useTheme'

export * from './lib/validation'
export * from './model/constants'
export * from './model/types'
