import { test, expect } from '@playwright/test'

/**
 * Opcional: define `E2E_EMAIL` y `E2E_PASSWORD` (entorno o `.env` con prefijo E2E_, cargado en playwright.config).
 * Sin ellos el test se omite para no romper CI/local sin credenciales de prueba.
 */

test.describe('Login E2E', () => {
  test('debería iniciar sesión y mostrar la barra de navegación', async ({ page }) => {
    const email = process.env.E2E_EMAIL?.trim()
    const password = process.env.E2E_PASSWORD?.trim()
    test.skip(!email || !password, 'Define E2E_EMAIL y E2E_PASSWORD para ejecutar este test')

    await page.goto('/', { waitUntil: 'domcontentloaded' })

    await page.locator('#login-email').fill(email!)
    await page.locator('#login-password').fill(password!)
    await page.getByRole('button', { name: /iniciar sesión|sign in/i }).click()

    await expect(page.locator('nav.app-navbar')).toBeVisible({ timeout: 30_000 })
  })
})
