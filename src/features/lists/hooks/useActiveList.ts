import { useEffect, useState } from 'react'

type ActiveList = {
  id: string
  name: string
}

const STORAGE_KEY = 'activeList'

export const useActiveList = () => {
  const [activeList, setActiveListState] = useState<ActiveList | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setActiveListState(JSON.parse(stored))
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  const setActiveList = (list: ActiveList) => {
    setActiveListState(list)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  }

  const clearActiveList = () => {
    setActiveListState(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    activeList,
    setActiveList,
    clearActiveList,
  }
}