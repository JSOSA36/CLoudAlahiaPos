import { test, expect } from '@playwright/test';

/**
 * Recorrido funcional mínimo:
 * Login → Dashboard → Clientes → Dashboard → POS → cierre
 *
 * Credenciales (por variables de entorno):
 *   ALAHIA_USER / ALAHIA_PASS
 * URL (opcional):
 *   ALAHIA_BASE_URL  (default http://localhost:8100)
 */
const USER = process.env.ALAHIA_USER || 'TU_USUARIO_PRUEBA';
const PASS = process.env.ALAHIA_PASS || 'TU_PASSWORD_PRUEBA';

test.describe('Alahia ERP — recorrido básico', () => {
  test('login, clientes y POS con grabación de video', async ({ page }) => {
    // 1–3. Abrir Chrome, ir a la URL y esperar login
    await page.goto('/');
    await expect(page.getByText('Iniciar Sesión')).toBeVisible({ timeout: 60_000 });

    // 4. Escribir usuario y contraseña (ion-input → input nativo)
    const usuarioInput = page.locator('ion-input').nth(0).locator('input');
    const passwordInput = page.locator('ion-input').nth(1).locator('input');
    await usuarioInput.waitFor({ state: 'visible' });
    await usuarioInput.fill(USER);
    await passwordInput.fill(PASS);

    // 5. Iniciar sesión
    await page.locator('ion-button', { hasText: 'Iniciar Sesión' }).click();

    // 6. Esperar Dashboard
    await page.waitForURL(/dashboard-gerencial|folder|home/i, { timeout: 60_000 });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.waitForTimeout(2000);

    // 7–8. Ir al listado de Clientes
    await page.goto('/clientemodal');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/clientemodal/i);

    // 9. Esperar 3 segundos
    await page.waitForTimeout(3000);

    // 10. Regresar al Dashboard
    await page.goto('/dashboard-gerencial');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    // 11–12. Ir al POS y esperar 5 segundos
    await page.goto('/pos');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/pos/i);
    await page.waitForTimeout(5000);

    // 13. Playwright cierra el navegador al terminar el test
  });
});
