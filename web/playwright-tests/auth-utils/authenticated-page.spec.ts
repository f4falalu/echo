import { BusterRoutes, createBusterRoute } from '@/routes';
import { test, expect } from '@playwright/test';

const homePage = createBusterRoute({
  route: BusterRoutes.APP_HOME
});
const loginPage = createBusterRoute({
  route: BusterRoutes.AUTH_LOGIN
});

test.describe('Authentication Flow', () => {
  test('should redirect when cookies are cleared', async ({ page, context }) => {
    // First visit home page
    await page.goto(homePage);
    await expect(page).toHaveURL(homePage);

    // Clear cookies to remove authentication
    await context.clearCookies();

    // Try to access the protected home page again
    await page.goto(homePage);
    await page.waitForTimeout(100);

    // Should be redirected away from the protected route
    await expect(page).not.toHaveURL(homePage);
    await expect(page).toHaveURL(loginPage);
  });

  test('go to home page', async ({ page }) => {
    await page.goto(homePage);

    //for 100 milliseconds
    await page.waitForTimeout(100);

    await expect(page).toHaveURL(homePage);
  });
});
