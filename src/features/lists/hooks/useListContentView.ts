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

function normalizeSearchText(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

export const useListContentView = ({
  items,
  filters,
  currentPage,
  itemsPerPage = DEFAULT_ITEMS_PER_PAGE,
}: UseListContentViewParams): UseListContentViewReturn => {
  const searchedAndSortedItems = useMemo(() => {
    const tagRaw = filters.tagFilter?.trim() ?? ''
    const tagNorm = tagRaw.length > 0 ? normalizeSearchText(tagRaw) : ''

    return items
      .filter((item) => {
        const raw = filters.searchQuery?.trim() ?? ''
        if (!raw) return true
        const q = normalizeSearchText(raw)
        const t1 = normalizeSearchText(item.titulo ?? '')
        const t2 = normalizeSearchText(item.title_es ?? '')
        return t1.includes(q) || (t2.length > 0 && t2.includes(q))
      })
      .filter((item) => {
        if (!tagNorm) return true
        const tags = item.tags ?? []
        return tags.some((tg) => normalizeSearchText(String(tg)) === tagNorm)
      })
      .sort((a, b) => {
        let compareResult = 0

        switch (filters.sortBy) {
          case 'manual':
            compareResult = (a.sort_index ?? 0) - (b.sort_index ?? 0)
            break
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
  }, [filters.searchQuery, filters.sortBy, filters.sortOrder, filters.tagFilter, items])

  const pendingItems = useMemo(
    () => searchedAndSortedItems.filter((item) => !item.visto),
    [searchedAndSortedItems],
  )

  const watchedItems = useMemo(
    () => searchedAndSortedItems.filter((item) => item.visto),
    [searchedAndSortedItems],
  )

  const visiblePendingItems = useMemo(
    () => (filters.showUnwatched ? pendingItems : []),
    [filters.showUnwatched, pendingItems],
  )

  const visibleWatchedItems = useMemo(
    () => (filters.showWatched ? watchedItems : []),
    [filters.showWatched, watchedItems],
  )

  const totalVisibleItems = visiblePendingItems.length + visibleWatchedItems.length

  const skipPagination = filters.sortBy === 'manual'

  const activePaginationList = filters.showUnwatched ? visiblePendingItems : visibleWatchedItems
  const totalPages = skipPagination
    ? 1
    : Math.max(1, Math.ceil(activePaginationList.length / itemsPerPage))

  const paginatedPendingItems = useMemo(() => {
    if (skipPagination) return visiblePendingItems
    return visiblePendingItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  }, [currentPage, itemsPerPage, skipPagination, visiblePendingItems])

  const paginatedWatchedItems = useMemo(() => {
    if (skipPagination) return visibleWatchedItems
    return visibleWatchedItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  }, [currentPage, itemsPerPage, skipPagination, visibleWatchedItems])

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
