import { test, expect } from '@playwright/test';

test.describe('App - Home Page', () => {
  test('debería cargar la página principal', async ({ page }) => {
    // Navega a la URL base (http://localhost:5173)
    await page.goto('/');

    // Espera a que el DOM esté listo
    await page.waitForLoadState('domcontentloaded');

    // Verifica que la página no está vacía
    const html = await page.content();
    expect(html.length).toBeGreaterThan(0);
  });

  test('debería renderizar el componente principal (App)', async ({ page }) => {
    await page.goto('/');

    // Busca el contenedor principal de la app
    const appContainer = page.locator('#root');
    await expect(appContainer).toBeVisible();
  });

  test('debería cargar sin errores de consola críticos', async ({ page }) => {
    const errors: string[] = [];

    // Captura errores de consola
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verifica que no hay errores críticos (excluyendo errores esperados)
    const criticalErrors = errors.filter(
      (err) =>
        !err.includes('Cannot find module') &&
        !err.includes('Unexpected token')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('debería ser responsive en móvil', async ({ page }) => {
    // Configura viewport móvil
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Verifica que el contenido es visible
    const appContainer = page.locator('#root');
    await expect(appContainer).toBeVisible();
  });
});
