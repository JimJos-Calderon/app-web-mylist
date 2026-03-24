import React from 'react'
import AppShell from '@/app/AppShell'
import { useAndroidBackButton } from '@/hooks/useAndroidBackButton'

const App: React.FC = () => {
  useAndroidBackButton()

  return <AppShell />
}

export default App