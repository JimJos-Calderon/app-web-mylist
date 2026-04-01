import React from 'react'
import { useTranslation } from 'react-i18next'
import { XCircle, X } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

interface ErrorAlertProps {
  message: string
  onClose: () => void
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onClose }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const isTerminal = theme === 'terminal'
  
  React.useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`mb-6 p-4 flex items-start gap-3 animate-in slide-in-from-top duration-300 ${
      isTerminal
        ? 'border border-[rgba(255,0,0,0.8)] bg-[rgba(20,0,0,0.9)] rounded-none'
        : 'bg-red-500/10 border border-red-500/30 rounded-lg'
    }`}>
      <XCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isTerminal ? 'text-[#ff0000]' : 'text-red-400'}`} />
      <div className="flex-1">
        <p className={`text-sm font-medium ${isTerminal ? 'theme-body-font text-[#ff4d4d]' : 'text-red-200'}`}>
          {isTerminal ? '[FATAL_ERROR] ' : ''}{message}
        </p>
      </div>
      <button
        onClick={onClose}
        className={isTerminal ? 'terminal-button theme-heading-font rounded-none px-2 py-1 text-[#ff4d4d] border-[rgba(255,0,0,0.8)]' : 'text-red-400 hover:text-red-300 transition-colors'}
        aria-label={t('buttons.close_alert')}
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  )
}

export default ErrorAlert
