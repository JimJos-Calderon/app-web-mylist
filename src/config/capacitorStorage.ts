import { Preferences } from '@capacitor/preferences'

const logStorageError = (action: string, key: string, error: unknown) => {
  if (import.meta.env.DEV) {
    console.warn(`[capacitorStorage] ${action} failed for key "${key}"`, error)
  }
}

export const capacitorStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key })
      return value ?? null
    } catch (error) {
      logStorageError('getItem', key, error)
      return null
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await Preferences.set({ key, value })
    } catch (error) {
      logStorageError('setItem', key, error)
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await Preferences.remove({ key })
    } catch (error) {
      logStorageError('removeItem', key, error)
    }
  },
}
