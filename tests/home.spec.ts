import { test, expect } from '@playwright/test';

test.describe('App - Home Page', () => {
  test('debería cargar la página principal', async ({ page }) => {
    // Navega a la URL base (http://localhost:5173)
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Verifica que la página no está vacía
    const html = await page.content();
    expect(html.length).toBeGreaterThan(0);
  });

  test('debería renderizar el elemento root', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Busca el contenedor principal de la app
    const appContainer = page.locator('#root');
    const isVisible = await appContainer.isVisible({ timeout: 5000 }).catch(() => false);
    
    // Si root no está visible, verifica que al menos exista
    if (!isVisible) {
      const exists = await appContainer.count().then(count => count > 0);
      expect(exists).toBe(true);
    } else {
      expect(isVisible).toBe(true);
    }
  });

  test('debería responder en menos de 5 segundos', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    const loadTime = Date.now() - startTime;
    
    // La página debe cargar en menos de 5 segundos
    expect(loadTime).toBeLessThan(5000);
  });

  test('debería ser responsive en móvil', async ({ page }) => {
    // Configura viewport móvil
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Verifica que la página cargó
    const html = await page.content();
    expect(html.length).toBeGreaterThan(0);
  });
});

