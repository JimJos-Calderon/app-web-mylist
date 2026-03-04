import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLists } from '@hooks/useLists'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

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
]

// Mockeamos el supabaseClient
vi.mock('@/supabaseClient', () => {
  return {
    supabase: {
      from: vi.fn((table: string) => {
        if (table === 'list_members') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() =>
                Promise.resolve({
                  data: [{ list_id: 'list-1' }],
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
        } else if (table === 'lists') {
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
  })

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: new QueryClient() }, children)
  }

  it('debería retornar un estado inicial correcto', () => {
    const { result } = renderHook(() => useLists('user-1'), {
      wrapper: createWrapper(),
    })

    expect(result.current.lists).toBeDefined()
    expect(Array.isArray(result.current.lists)).toBe(true)
    expect(result.current.currentList).toBeNull()
  })

  it('debería retornar un array vacío cuando userId es undefined', () => {
    const { result } = renderHook(() => useLists(undefined), {
      wrapper: createWrapper(),
    })

    expect(result.current.lists).toEqual([])
  })

  it('debería permitir cambiar la lista actual', () => {
    const { result } = renderHook(() => useLists('user-1'), {
      wrapper: createWrapper(),
    })

    const mockList = mockLists[0]
    act(() => {
      result.current.setCurrentList(mockList)
    })

    expect(result.current.currentList).toEqual(mockList)
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

  it('debería retornar error null inicialmente', () => {
    const { result } = renderHook(() => useLists('user-1'), {
      wrapper: createWrapper(),
    })

    expect(result.current.error).toBeNull()
  })
})
