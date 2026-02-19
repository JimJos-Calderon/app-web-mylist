import { useState, useCallback } from 'react'
import { FilterState } from '@types/index'

interface UseFiltersReturn {
  filters: FilterState
  updateFilter: (key: keyof FilterState, value: any) => void
  resetFilters: () => void
}

const initialFilters: FilterState = {
  showWatched: false,
  showUnwatched: true,
  sortBy: 'date',
  sortOrder: 'desc',
  searchQuery: '',
}

export const useFilters = (): UseFiltersReturn => {
  const [filters, setFilters] = useState<FilterState>(initialFilters)

  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(initialFilters)
  }, [])

  return {
    filters,
    updateFilter,
    resetFilters,
  }
}
