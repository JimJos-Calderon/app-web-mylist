import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useLists } from '@/features/lists/hooks/useLists'

// Mock data
const mockLists = [
  {
    id: 'list-1',
    name: 'Películas Favoritas',
    description: 'Mis películas más favoritas',
    owner_id: 'user-1',
    invite_code: 'ABC123',
    is_private: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'list-2',
    name: 'Series Pendientes',
    description: 'Series para ver juntos',
    owner_id: 'user-1',
    invite_code: 'XYZ789',
    is_private: false,
    created_at: '2025-01-02T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
  },
]

// Mock supabase
vi.mock('@/supabaseClient', () => {
  return {
    supabase: {
      rpc: vi.fn(() =>
        Promise.resolve({
          data: [
            {
              joined: true,
              status: 'JOINED',
              list_id: 'list-1',
              membership_role: 'member',
            },
          ],
          error: null,
        })
      ),
      from: vi.fn((table: string) => {
        if (table === 'list_members') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() =>
                Promise.resolve({
                  data: [{ list_id: 'list-1' }, { list_id: 'list-2' }],
                  error: null,
                })
              ),
            })),
            insert: vi.fn(() =>
              Promise.resolve({
                data: null,
                error: null,
              })
            ),
          }
        }

        if (table === 'lists') {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => ({
                order: vi.fn(() =>
                  Promise.resolve({
                    data: mockLists,
                    error: null,
                  })
                ),
              })),
              order: vi.fn(() =>
                Promise.resolve({
                  data: mockLists,
                  error: null,
                })
              ),
            })),
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: mockLists[0],
                    error: null,
                  })
                ),
              })),
            })),
          }
        }

        return {}
      }),
    },
  }
})

describe('useLists', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    })

    return ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children)
  }

  it('debería retornar un estado inicial utilizable', async () => {
    const { result } = renderHook(() => useLists('user-1'), {
      wrapper: createWrapper(),
    })

    expect(Array.isArray(result.current.lists)).toBe(true)
    expect(result.current.error).toBeNull()

    await waitFor(() => {
      expect(result.current.lists.length).toBe(2)
    })

    await waitFor(() => {
      expect(result.current.currentList?.id).toBe('list-1')
    })
  })

  it('debería retornar un array vacío cuando userId es undefined', () => {
    const { result } = renderHook(() => useLists(undefined), {
      wrapper: createWrapper(),
    })

    expect(result.current.lists).toEqual([])
    expect(result.current.currentList).toBeNull()
  })

  it('debería derivar currentList desde lists + activeList y persistirla al cambiar', async () => {
    const { result } = renderHook(() => useLists('user-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.lists.length).toBe(2)
    })

    await waitFor(() => {
      expect(result.current.currentList?.id).toBe('list-1')
    })

    const targetList = mockLists[1]

    act(() => {
      result.current.setCurrentList(targetList)
    })

    await waitFor(() => {
      expect(result.current.currentList?.id).toBe('list-2')
    })

    const stored = JSON.parse(localStorage.getItem('activeList') || 'null')
    expect(stored).toEqual({
      id: 'list-2',
      name: 'Series Pendientes',
    })
  })

  it('debería seleccionar automáticamente la primera lista si no hay activeList previa', async () => {
    const { result } = renderHook(() => useLists('user-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.currentList?.id).toBe('list-1')
    })

    const stored = JSON.parse(localStorage.getItem('activeList') || 'null')
    expect(stored).toEqual({
      id: 'list-1',
      name: 'Películas Favoritas',
    })
  })

  it('debería exponer funciones de mutación', () => {
    const { result } = renderHook(() => useLists('user-1'), {
      wrapper: createWrapper(),
    })

    expect(typeof result.current.createList).toBe('function')
    expect(typeof result.current.joinListByCode).toBe('function')
    expect(typeof result.current.getListMembers).toBe('function')
    expect(typeof result.current.refreshLists).toBe('function')
  })

  it('debería tener indicadores de estado para mutaciones', () => {
    const { result } = renderHook(() => useLists('user-1'), {
      wrapper: createWrapper(),
    })

    expect(result.current.isCreatingList).toBe(false)
    expect(result.current.isJoiningList).toBe(false)
  })
})