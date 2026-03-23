import { useState, useCallback, useMemo } from 'react'

interface UseRandomSelectionReturn<T> {
  selectedItem: T | null
  selectRandom: (items: T[]) => void
  resetSelection: () => void
  canSelect: boolean
}

/**
 * Hook genérico para selección aleatoria de elementos.
 * Garantiza que no se repita el mismo elemento consecutivamente.
 */
export function useRandomSelection<T extends { id: string | number }>(
  filterFn?: (item: T) => boolean
): UseRandomSelectionReturn<T> {
  const [selectedItem, setSelectedItem] = useState<T | null>(null)

  const selectRandom = useCallback(
    (items: T[]) => {
      // Aplicar filtro si existe (ej. descartar vistos)
      const pool = filterFn ? items.filter(filterFn) : items

      if (pool.length === 0) {
        setSelectedItem(null)
        return
      }

      if (pool.length === 1) {
        setSelectedItem(pool[0])
        return
      }

      // Evitar repetir el mismo item consecutivamente
      let nextItem: T
      do {
        const randomIndex = Math.floor(Math.random() * pool.length)
        nextItem = pool[randomIndex]
      } while (selectedItem && nextItem.id === selectedItem.id)

      setSelectedItem(nextItem)
    },
    [filterFn, selectedItem]
  )

  const resetSelection = useCallback(() => {
    setSelectedItem(null)
  }, [])

  const canSelect = useMemo(() => {
    return true // Podríamos añadir lógica aquí si fuera necesario
  }, [])

  return {
    selectedItem,
    selectRandom,
    resetSelection,
    canSelect,
  }
}
