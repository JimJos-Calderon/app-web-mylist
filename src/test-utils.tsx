import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/**
 * Crea un nuevo QueryClient para cada test
 * Esto evita que los tests interfieran entre sí
 */
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  queryClient?: QueryClient
}

/**
 * Wrapper personalizado que proporciona QueryClientProvider a los tests
 */
function Wrapper({
  children,
  queryClient,
}: {
  children: React.ReactNode
  queryClient: QueryClient
}) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

/**
 * Función render personalizada que incluye el Wrapper con QueryClient
 * Uso: render(<MyComponent />, { wrapper: Wrapper })
 * O usar: renderWithQueryClient(<MyComponent />)
 */
export function renderWithQueryClient(
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <Wrapper queryClient={queryClient}>{children}</Wrapper>
    ),
    ...renderOptions,
  })
}

// Re-exporta todo de Testing Library para poder usar: 
// import { screen, fireEvent, renderWithQueryClient } from '@/test-utils'
export * from '@testing-library/react'
