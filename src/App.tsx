import React, { useEffect } from 'react'
import { SplashScreen } from '@capacitor/splash-screen'
import AppShell from '@/app/AppShell'
import { CyberpunkLinesBackground, TerminalMatrixBackground } from '@/features/shared'
import { useTheme } from '@/features/shared/hooks/useTheme'
import { useAndroidBackButton } from '@/hooks/useAndroidBackButton'
import { useAndroidPushNotificationDeepLink } from '@/hooks/useAndroidPushNotificationDeepLink'

const App: React.FC = () => {
  const { theme } = useTheme()

  useAndroidBackButton()
  useAndroidPushNotificationDeepLink()

  useEffect(() => {
    // El delay de 500ms asegura que React y el DOM final hayan pintado el primer frame realista
    const timer = setTimeout(() => {
      SplashScreen.hide().catch(console.error)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      {theme === 'cyberpunk' && <CyberpunkLinesBackground />}
      {theme === 'terminal' && <TerminalMatrixBackground />}
      <div className="app-view-layer min-h-screen">
        <AppShell />
      </div>
    </>
  )
}

export default App