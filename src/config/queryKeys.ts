/**
 * Query Keys Factory
 * 
 * Estructura centralizada para todas las query keys.
 * Esto facilita la invalidación selectiva y evita hardcodear strings.
 * 
 * Referencia: https://tanstack.com/query/latest/docs/react/important-defaults
 */

export const queryKeys = {
  // ─── Items ───────────────────────────────────────────────────────
  items: {
    all: ['items'] as const,
    byType: (tipo: 'pelicula' | 'serie') => [...queryKeys.items.all, tipo] as const,
    byList: (tipo: 'pelicula' | 'serie', listId: string) => [
      ...queryKeys.items.byType(tipo),
      listId,
    ] as const,
    detail: (id: string) => ['items', id] as const,
  },

  itemComments: {
    all: ['itemComments'] as const,
    byItem: (itemId: string) => [...queryKeys.itemComments.all, itemId] as const,
    byItemAndUser: (itemId: string, userId: string) => [
      ...queryKeys.itemComments.byItem(itemId),
      userId,
    ] as const,
  },

  // ─── Lists ───────────────────────────────────────────────────────
  lists: {
    all: ['lists'] as const,
    byUser: (userId: string) => [...queryKeys.lists.all, userId] as const,
    detail: (listId: string) => ['lists', listId] as const,
    members: (listId: string) => [...queryKeys.lists.detail(listId), 'members'] as const,
    activityFeed: (listId: string, limit: number) => [...queryKeys.lists.all, 'activityFeed', listId, limit] as const,
  },

  // ─── OMDB (External API) ──────────────────────────────────────
  omdb: {
    all: ['omdb'] as const,
    search: (query: string) => [...queryKeys.omdb.all, 'search', query] as const,
    poster: (title: string) => [...queryKeys.omdb.all, 'poster', title] as const,
    synopsis: (title: string) => [...queryKeys.omdb.all, 'synopsis', title] as const,
    genre: (title: string) => [...queryKeys.omdb.all, 'genre', title] as const,
  },

  // ─── User Profile ────────────────────────────────────────────────
  userProfile: {
    all: ['userProfile'] as const,
    byUser: (userId: string) => [...queryKeys.userProfile.all, userId] as const,
    themePreferenceByUser: (userId: string) => [...queryKeys.userProfile.all, 'themePreference', userId] as const,
  },

  translations: {
    all: ['translations'] as const,
    byText: (source: string, targetLanguage: string, text: string) => [
      ...queryKeys.translations.all,
      source,
      targetLanguage,
      text,
    ] as const,
  },

  // ─── Suggestions ─────────────────────────────────────────────────
  suggestions: {
    all: ['suggestions'] as const,
    byType: (tipo: 'pelicula' | 'serie', query: string = '') => [...queryKeys.suggestions.all, tipo, query] as const,
  },
} as const
