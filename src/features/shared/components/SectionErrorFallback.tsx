import React from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, RotateCw } from 'lucide-react'

import { FallbackProps } from 'react-error-boundary'

/**
 * SectionErrorFallback
 *
 * Fallback compacto para secciones individuales.
 * A diferencia del GlobalErrorFallback, este no ocupa toda la pantalla,
 * permitiendo que el resto de la app siga funcionando.
 */
export const SectionErrorFallback: React.FC<FallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  const { t } = useTranslation()
  const isDev = import.meta.env.DEV

  return (
    <div className="w-full flex items-center justify-center py-16 px-4">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="inline-flex items-center justify-center">
          <div className="bg-amber-500/10 p-3 rounded-full border border-amber-500/30">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-1">
            Error al cargar esta sección
          </h2>
          <p className="text-sm text-zinc-400">
            Algo falló, pero el resto de la app sigue funcionando.
          </p>
        </div>

        {isDev && (
          <p className="text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-left break-words">
            {error.message}
          </p>
        )}

        <button
          onClick={resetErrorBoundary}
          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <RotateCw className="w-4 h-4" />
          {t('common.retry')}
        </button>
      </div>
    </div>
  )
}

export default SectionErrorFallback
