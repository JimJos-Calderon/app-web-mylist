import { useMemo } from 'react'
import { FilterState, ListItem } from '@/features/shared'

interface UseListContentViewParams {
  items: ListItem[]
  filters: FilterState
  currentPage: number
  itemsPerPage?: number
}

interface UseListContentViewReturn {
  searchedAndSortedItems: ListItem[]
  pendingItems: ListItem[]
  watchedItems: ListItem[]
  visiblePendingItems: ListItem[]
  visibleWatchedItems: ListItem[]
  totalVisibleItems: number
  totalPages: number
  paginatedPendingItems: ListItem[]
  paginatedWatchedItems: ListItem[]
}

const DEFAULT_ITEMS_PER_PAGE = 9

export const useListContentView = ({
  items,
  filters,
  currentPage,
  itemsPerPage = DEFAULT_ITEMS_PER_PAGE,
}: UseListContentViewParams): UseListContentViewReturn => {
  const searchedAndSortedItems = useMemo(() => {
    return items
      .filter((item) => {
        if (!filters.searchQuery) return true
        return item.titulo.toLowerCase().includes(filters.searchQuery.toLowerCase())
      })
      .sort((a, b) => {
        let compareResult = 0

        switch (filters.sortBy) {
          case 'title':
            compareResult = a.titulo.localeCompare(b.titulo)
            break
          case 'rating':
            compareResult = (a.rating || 0) - (b.rating || 0)
            break
          case 'date':
          default:
            compareResult = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            break
        }

        return filters.sortOrder === 'desc' ? -compareResult : compareResult
      })
  }, [filters.searchQuery, filters.sortBy, filters.sortOrder, items])

  const pendingItems = useMemo(
    () => searchedAndSortedItems.filter((item) => !item.visto),
    [searchedAndSortedItems]
  )

  const watchedItems = useMemo(
    () => searchedAndSortedItems.filter((item) => item.visto),
    [searchedAndSortedItems]
  )

  const visiblePendingItems = useMemo(
    () => (filters.showUnwatched ? pendingItems : []),
    [filters.showUnwatched, pendingItems]
  )

  const visibleWatchedItems = useMemo(
    () => (filters.showWatched ? watchedItems : []),
    [filters.showWatched, watchedItems]
  )

  const totalVisibleItems = visiblePendingItems.length + visibleWatchedItems.length

  const activePaginationList = filters.showUnwatched ? visiblePendingItems : visibleWatchedItems
  const totalPages = Math.max(1, Math.ceil(activePaginationList.length / itemsPerPage))

  const paginatedPendingItems = useMemo(
    () => visiblePendingItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [currentPage, itemsPerPage, visiblePendingItems]
  )

  const paginatedWatchedItems = useMemo(
    () => visibleWatchedItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [currentPage, itemsPerPage, visibleWatchedItems]
  )

  return {
    searchedAndSortedItems,
    pendingItems,
    watchedItems,
    visiblePendingItems,
    visibleWatchedItems,
    totalVisibleItems,
    totalPages,
    paginatedPendingItems,
    paginatedWatchedItems,
  }
}