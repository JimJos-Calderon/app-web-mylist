import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { useItems } from '@/features/items/hooks/useItems'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Mock data
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

// Mockeamos el supabaseClient
vi.mock('@/supabaseClient', () => {
  const createChain = () => ({
    eq: vi.fn(() => createChain()),
    order: vi.fn(async () => ({ data: mockItems, error: null })),
  })

  return {
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn(() => createChain()),
        insert: vi.fn(async () => ({ data: null, error: null })),
        delete: vi.fn(() => ({
          eq: vi.fn(async () => ({ data: null, error: null })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(async () => ({ data: null, error: null })),
        })),
      })),
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
  })

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => React.createElement(
      QueryClientProvider,
      { client: new QueryClient() },
      children
    )
  }

  it('debería retornar un estado inicial correcto', () => {
    const { result } = renderHook(() => useItems('pelicula', 'user-1', 'list-1'), {
      wrapper: createWrapper(),
    })

    expect(result.current.items).toBeDefined()
    expect(Array.isArray(result.current.items)).toBe(true)
  })

  it('debería cargar items correctamente cuando userId y listId están disponibles', async () => {
    const { result } = renderHook(
      () => useItems('pelicula', 'user-1', 'list-1'),
      {
        wrapper: createWrapper(),
      }
    )

    await waitFor(
      () => {
        expect(result.current.items.length).toBeGreaterThan(0)
      },
      { timeout: 3000 }
    )

    expect(result.current.items).toHaveLength(2)
    expect(result.current.items[0].titulo).toBe('The Matrix')
    expect(result.current.items[1].titulo).toBe('Inception')
    expect(result.current.loading).toBe(false)
  })

  it('debería retornar un array vacío cuando userId o listId no están disponibles', () => {
    const { result } = renderHook(
      () => useItems('pelicula', '', ''),
      {
        wrapper: createWrapper(),
      }
    )

    expect(result.current.items).toEqual([])
  })

  it('debería exponer funciones de mutación (addItem, deleteItem, etc.)', () => {
    const { result } = renderHook(
      () => useItems('pelicula', 'user-1', 'list-1'),
      {
        wrapper: createWrapper(),
      }
    )

    expect(typeof result.current.addItem).toBe('function')
    expect(typeof result.current.deleteItem).toBe('function')
    expect(typeof result.current.toggleVisto).toBe('function')
    expect(typeof result.current.updateItem).toBe('function')
  })

  it('debería tener indicadores de estado para mutaciones', () => {
    const { result } = renderHook(
      () => useItems('pelicula', 'user-1', 'list-1'),
      {
        wrapper: createWrapper(),
      }
    )

    expect(result.current.isAddingItem).toBe(false)
    expect(result.current.isDeletingItem).toBe(false)
    expect(result.current.isUpdatingItem).toBe(false)
  })
})
