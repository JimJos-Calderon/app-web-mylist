import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { useItems } from '@/features/items/hooks/useItems'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

const insertMockState = vi.hoisted(() => ({
  insertError: null as { code: string; message?: string } | null,
  lastInsertPayload: null as unknown[] | null,
}))

const mockItems = [
  {
    id: '1',
    titulo: 'The Matrix',
    tipo: 'pelicula' as const,
    visto: false,
    user_id: 'user-1',
    user_email: 'test@test.com',
    poster_url: null,
    created_at: '2025-01-01T00:00:00Z',
    list_id: 'list-1',
  },
  {
    id: '2',
    titulo: 'Inception',
    tipo: 'pelicula' as const,
    visto: true,
    user_id: 'user-1',
    user_email: 'test@test.com',
    poster_url: null,
    created_at: '2025-01-02T00:00:00Z',
    list_id: 'list-1',
  },
]

vi.mock('@/supabaseClient', () => {
  const itemsListChain = () => ({
    eq: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          order: vi.fn(async () => ({ data: mockItems, error: null })),
        })),
      })),
    })),
  })

  const maxSortChain = () => ({
    eq: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: { sort_index: 2 }, error: null })),
          })),
        })),
      })),
    })),
  })

  const memberChain = () => ({
    eq: vi.fn(async () => ({ count: 2, error: null })),
  })

  const watchUserChain = () => ({
    eq: vi.fn(() => ({
      in: vi.fn(async () => ({
        data: [
          { item_id: '1', watched: false },
          { item_id: '2', watched: true },
        ],
        error: null,
      })),
    })),
  })

  const watchGroupChain = () => ({
    eq: vi.fn(() => ({
      in: vi.fn(async () => ({
        data: [{ item_id: '2' }],
        error: null,
      })),
    })),
  })

  return {
    supabase: {
      from: vi.fn((table: string) => {
        if (table === 'list_members') {
          return {
            select: vi.fn((_c: string, _opts?: { count?: string; head?: boolean }) => memberChain()),
          }
        }
        if (table === 'item_user_watch') {
          return {
            select: vi.fn((cols: string) => {
              if (cols.includes('watched')) {
                return watchUserChain()
              }
              return watchGroupChain()
            }),
          }
        }
        return {
          select: vi.fn((cols: string) => {
            if (cols === 'sort_index') {
              return maxSortChain()
            }
            return itemsListChain()
          }),
          insert: vi.fn(async (rows: unknown) => {
            insertMockState.lastInsertPayload = rows as unknown[]
            return { data: null, error: insertMockState.insertError }
          }),
          delete: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(async () => ({ data: null, error: null })),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(async () => ({ data: null, error: null })),
          })),
          upsert: vi.fn(async () => ({ data: null, error: null })),
        }
      }),
      channel: vi.fn(() => ({
        on: vi.fn(function (this: any) {
          return this
        }),
        subscribe: vi.fn(function (this: any) {
          return this
        }),
      })),
      removeChannel: vi.fn(),
    },
  }
})

describe('useItems', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    insertMockState.insertError = null
    insertMockState.lastInsertPayload = null
  })

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: new QueryClient() }, children)
  }

  it('debería retornar un estado inicial correcto', () => {
    const { result } = renderHook(() => useItems('pelicula', 'user-1', 'list-1'), {
      wrapper: createWrapper(),
    })

    expect(result.current.items).toBeDefined()
    expect(Array.isArray(result.current.items)).toBe(true)
    expect(typeof result.current.listMemberCount).toBe('number')
  })

  it('debería cargar items correctamente cuando userId y listId están disponibles', async () => {
    const { result } = renderHook(() => useItems('pelicula', 'user-1', 'list-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(
      () => {
        expect(result.current.items.length).toBeGreaterThan(0)
      },
      { timeout: 3000 },
    )

    expect(result.current.items).toHaveLength(2)
    expect(result.current.items[0].titulo).toBe('The Matrix')
    expect(result.current.items[1].titulo).toBe('Inception')
    expect(result.current.listMemberCount).toBe(2)
    expect(result.current.items[1].watch_group).toEqual({ watched: 1, total: 2 })
    expect(result.current.loading).toBe(false)
  })

  it('debería retornar un array vacío cuando userId o listId no están disponibles', () => {
    const { result } = renderHook(() => useItems('pelicula', '', ''), {
      wrapper: createWrapper(),
    })

    expect(result.current.items).toEqual([])
    expect(result.current.listMemberCount).toBe(0)
  })

  it('debería exponer funciones de mutación (addItem, deleteItem, etc.)', () => {
    const { result } = renderHook(() => useItems('pelicula', 'user-1', 'list-1'), {
      wrapper: createWrapper(),
    })

    expect(typeof result.current.addItem).toBe('function')
    expect(typeof result.current.deleteItem).toBe('function')
    expect(typeof result.current.toggleVisto).toBe('function')
    expect(typeof result.current.updateItem).toBe('function')
  })

  it('debería tener indicadores de estado para mutaciones', () => {
    const { result } = renderHook(() => useItems('pelicula', 'user-1', 'list-1'), {
      wrapper: createWrapper(),
    })

    expect(result.current.isAddingItem).toBe(false)
    expect(result.current.isDeletingItem).toBe(false)
    expect(result.current.isUpdatingItem).toBe(false)
  })

  it('addItem propaga error de duplicado (23505)', async () => {
    insertMockState.insertError = { code: '23505', message: 'duplicate key' }
    const { result } = renderHook(() => useItems('pelicula', 'user-1', 'list-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.items.length).toBe(2))

    const payload = {
      titulo: '  Dup  ',
      tipo: 'pelicula' as const,
      visto: false,
      user_id: 'user-1',
      user_email: 'a@b.com',
      poster_url: null,
      list_id: 'list-1',
    }

    await expect(result.current.addItem(payload)).rejects.toMatchObject({ code: '23505' })
  })

  it('addItem envía titulo sin espacios extremos', async () => {
    const { result } = renderHook(() => useItems('pelicula', 'user-1', 'list-1'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.items.length).toBe(2))

    await result.current.addItem({
      titulo: '  Trimmed  ',
      tipo: 'pelicula',
      visto: false,
      user_id: 'user-1',
      user_email: 'a@b.com',
      poster_url: null,
      list_id: 'list-1',
    })

    expect(insertMockState.lastInsertPayload).not.toBeNull()
    const row = insertMockState.lastInsertPayload![0] as { titulo: string; sort_index: number; tags: string[] }
    expect(row.titulo).toBe('Trimmed')
    expect(row.sort_index).toBe(3)
    expect(row.tags).toEqual([])
  })
})
