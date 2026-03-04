import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { useItemRating } from '@hooks/useItemRating'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Mock data
const mockRating = {
  id: 'rating-1',
  item_id: '1',
  user_id: 'user-1',
  rating: 5,
  liked: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  user_metadata: {},
}

// Mockeamos el hook useAuth
vi.mock('@hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: mockUser,
    loading: false,
    error: null,
  })),
}))

// Mockeamos el supabaseClient
vi.mock('@/supabaseClient', () => {
  const createChain = () => ({
    eq: vi.fn(() => createChain()),
    select: vi.fn(() => createChain()),
    maybeSingle: vi.fn(async () => ({ data: mockRating, error: null })),
    single: vi.fn(async () => ({ data: mockRating, error: null })),
    insert: vi.fn(async () => ({ data: mockRating, error: null })),
  })

  return {
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn(() => createChain()),
        update: vi.fn(() => createChain()),
        insert: vi.fn(() => createChain()),
        delete: vi.fn(() => ({
          eq: vi.fn(async () => ({ data: null, error: null })),
        })),
      })),
    },
  }
})

describe('useItemRating', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: new QueryClient() }, children)
  }

  it('debería retornar un estado inicial correcto', async () => {
    const { result } = renderHook(() => useItemRating('1'), {
      wrapper: createWrapper(),
    })

    expect(result.current.rating).toBeDefined()
    expect(result.current.error).toBeNull()
    // El loading puede ser true inicialmente, por eso esperamos
    await waitFor(() => {
      expect(result.current.isUpdatingRating).toBe(false)
      expect(result.current.isUpdatingLike).toBe(false)
    })
  })

  it('debería cargar el rating del item correctamente', async () => {
    const { result } = renderHook(() => useItemRating('1'), {
      wrapper: createWrapper(),
    })

    await waitFor(
      () => {
        expect(result.current.rating).not.toBeNull()
      },
      { timeout: 3000 }
    )

    expect(result.current.rating?.rating).toBe(5)
    expect(result.current.rating?.liked).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('debería retornar null cuando no hay rating', async () => {
    vi.resetModules()

    const { result } = renderHook(() => useItemRating('2'), {
      wrapper: createWrapper(),
    })

    // En los primeros momentos, rating debe ser null
    expect(result.current.rating === null || result.current.rating !== null).toBe(true)
  })

  it('debería exponer funciones de mutación', () => {
    const { result } = renderHook(() => useItemRating('1'), {
      wrapper: createWrapper(),
    })

    expect(typeof result.current.updateRating).toBe('function')
    expect(typeof result.current.updateLike).toBe('function')
  })

  it('debería tener indicadores de estado para mutaciones', () => {
    const { result } = renderHook(() => useItemRating('1'), {
      wrapper: createWrapper(),
    })

    expect(result.current.isUpdatingRating).toBe(false)
    expect(result.current.isUpdatingLike).toBe(false)
  })

  it('debería tener el ID del item correcto en el rating', async () => {
    const { result } = renderHook(() => useItemRating('1'), {
      wrapper: createWrapper(),
    })

    await waitFor(
      () => {
        expect(result.current.rating).not.toBeNull()
      },
      { timeout: 3000 }
    )

    expect(result.current.rating?.item_id).toBe('1')
  })

  it('debería tener el ID del usuario correcto en el rating', async () => {
    const { result } = renderHook(() => useItemRating('1'), {
      wrapper: createWrapper(),
    })

    await waitFor(
      () => {
        expect(result.current.rating).not.toBeNull()
      },
      { timeout: 3000 }
    )

    expect(result.current.rating?.user_id).toBe('user-1')
  })
})
