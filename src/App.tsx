import React, { useEffect } from 'react'
import { SplashScreen } from '@capacitor/splash-screen'
import AppShell from '@/app/AppShell'
import { useAndroidBackButton } from '@/hooks/useAndroidBackButton'

const App: React.FC = () => {
  useAndroidBackButton()

  useEffect(() => {
    // El delay de 500ms asegura que React y el DOM final hayan pintado el primer frame realista
    const timer = setTimeout(() => {
      SplashScreen.hide().catch(console.error)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  return <AppShell />
}

export default App