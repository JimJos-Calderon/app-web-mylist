import React from 'react'
import { AlertTriangle, RotateCw, Home } from 'lucide-react'

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

/**
 * GlobalErrorFallback
 * 
 * Componente de fallback reutilizable que se muestra cuando ocurre un error no capturado.
 * Proporciona UX amigable con:
 * - Descripción clara del problema
 * - Botón para reintentar (resetErrorBoundary)
 * - Botón para volver a Home
 * - Info del error en modo desarrollo
 */
export const GlobalErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  const isDevelopment = import.meta.env.DEV

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full"></div>
            <div className="relative bg-red-500/10 p-4 rounded-full border border-red-500/30 backdrop-blur-xl">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </div>

        {/* Error Title */}
        <h1 className="text-2xl font-black text-white text-center mb-2 uppercase tracking-tight">
          ¡Oups! Algo salió mal
        </h1>

        {/* Error Description */}
        <p className="text-center text-zinc-400 mb-6">
          Encontramos un error inesperado. No te preocupes, nuestro equipo ya ha sido notificado.
        </p>

        {/* Error Details (Development Only) */}
        {isDevelopment && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg backdrop-blur-xl">
            <p className="text-xs font-mono text-red-300 whitespace-pre-wrap break-words">
              {error.message}
            </p>
            {error.stack && (
              <details className="mt-2">
                <summary className="text-xs text-red-400 cursor-pointer hover:text-red-300">
                  Stack trace
                </summary>
                <pre className="mt-2 text-xs text-red-400 overflow-auto max-h-32">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={resetErrorBoundary}
            className="w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 group"
          >
            <RotateCw className="w-4 h-4 group-hover:rotate-180 transition-transform" />
            Reintentar
          </button>

          <a
            href="/"
            className="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Volver a inicio
          </a>
        </div>

        {/* Footer Info */}
        <p className="text-center text-xs text-zinc-500 mt-6">
          Si el problema persiste, contacta con soporte.
        </p>
      </div>
    </div>
  )
}

export default GlobalErrorFallback
