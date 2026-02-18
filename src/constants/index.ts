export const OMDB_BASE_URL = 'https://www.omdbapi.com/'
export const OMDB_API_KEY = import.meta.env.VITE_OMDB_KEY

export const DEBOUNCE_DELAY = 300
export const ITEMS_PER_PAGE = 50
export const MAX_SUGGESTIONS = 5

export const ERROR_MESSAGES = {
  FETCH_ITEMS: 'No se pudieron cargar los elementos',
  ADD_ITEM: 'Error al agregar elemento',
  DELETE_ITEM: 'Error al eliminar elemento',
  UPDATE_ITEM: 'Error al actualizar elemento',
  SEARCH_SUGGESTIONS: 'Error al buscar sugerencias',
  AUTH_REQUIRED: 'Se requiere autenticación',
  NETWORK_ERROR: 'Error de conectividad',
} as const

export const SUCCESS_MESSAGES = {
  ITEM_ADDED: 'Elemento agregado correctamente',
  ITEM_DELETED: 'Elemento eliminado',
  ITEM_UPDATED: 'Elemento actualizado',
} as const

export const SORT_OPTIONS = [
  { value: 'date', label: 'Más recientes' },
  { value: 'title', label: 'Título A-Z' },
  { value: 'rating', label: 'Mejor calificadas' },
] as const
