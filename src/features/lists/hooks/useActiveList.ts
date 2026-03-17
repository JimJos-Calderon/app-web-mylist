import { useSyncExternalStore } from 'react'

export type ActiveList = {
  id: string
  name: string
} | null

const STORAGE_KEY = 'activeList'

let activeListState: ActiveList = readStoredActiveList()
const listeners = new Set<() => void>()
let storageListenerInitialized = false

function readStoredActiveList(): ActiveList {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as ActiveList) : null
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

function emitChange() {
  listeners.forEach((listener) => listener())
}

function writeStoredActiveList(value: ActiveList) {
  activeListState = value

  if (typeof window !== 'undefined') {
    if (value) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  emitChange()
}

function ensureStorageListener() {
  if (storageListenerInitialized || typeof window === 'undefined') return

  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return
    activeListState = readStoredActiveList()
    emitChange()
  })

  storageListenerInitialized = true
}

export const useActiveList = () => {
  ensureStorageListener()

  const activeList = useSyncExternalStore(
    (callback) => {
      listeners.add(callback)
      return () => listeners.delete(callback)
    },
    () => activeListState,
    () => null
  )

  const setActiveList = (list: { id: string; name: string }) => {
    writeStoredActiveList(list)
  }

  const clearActiveList = () => {
    writeStoredActiveList(null)
  }

  return {
    activeList,
    setActiveList,
    clearActiveList,
  }
}