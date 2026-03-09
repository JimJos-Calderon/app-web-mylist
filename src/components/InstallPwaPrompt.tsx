import React, { useEffect, useState } from 'react'
import { Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

export const InstallPwaPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setIsVisible(true)
    }

    const onAppInstalled = () => {
      setDeferredPrompt(null)
      setIsVisible(false)
      setIsInstalling(false)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    setIsInstalling(true)

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        setIsVisible(false)
      }

      setDeferredPrompt(null)
    } catch (error) {
      console.error('Error showing install prompt:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  if (!isVisible || !deferredPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-[70]">
      <button
        type="button"
        onClick={handleInstallClick}
        disabled={isInstalling}
        className="group flex items-center gap-2 rounded-full border border-cyan-400/40 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-pink-500/20 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-[0_0_30px_rgba(34,211,238,0.25)] backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-cyan-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
        aria-label="Instalar App"
      >
        <Download className={`h-4 w-4 text-cyan-300 ${isInstalling ? 'animate-pulse' : 'group-hover:animate-bounce'}`} />
        <span>{isInstalling ? 'Instalando...' : 'Instalar App'}</span>
      </button>
    </div>
  )
}
