import React from 'react'
import { XCircle, X } from 'lucide-react'

interface ErrorAlertProps {
  message: string
  onClose: () => void
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3 animate-in slide-in-from-top duration-300">
      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-red-200 text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="text-red-400 hover:text-red-300 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export default ErrorAlert
