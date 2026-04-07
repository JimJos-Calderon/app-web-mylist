import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      includeAssets: [
        'favicon.png',
        'apple-touch-icon.png',
        'masked-icon.svg',
        'logo-navbar.webp',
        'login-bg.webp',
        'retro-login-bg.webp',
        'pwa-64x64.png',
      ],
      manifest: {
        name: 'MyList - Peliculas y Series',
        short_name: 'MyList',
        description: 'Gestiona tus listas de peliculas y series',
        theme_color: '#0b0b12',
        background_color: '#0b0b12',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      injectManifest: {
        // Incluye explícitamente marca y PWA para precache inmediato (logo webp + PNGs de icono).
        globPatterns: [
          '**/*.{js,css,html,ico,svg,webp,woff2}',
          'pwa-*.png',
          'favicon.png',
          'apple-touch-icon.png',
          'logo-navbar.webp',
          'login-bg.webp',
          'retro-login-bg.webp',
          'masked-icon.svg',
        ],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MiB
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@config': path.resolve(__dirname, './src/config'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    chunkSizeWarningLimit: 1500,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    globals: true,
    exclude: ['node_modules', 'tests/**/*.spec.ts', 'dist'],
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
})