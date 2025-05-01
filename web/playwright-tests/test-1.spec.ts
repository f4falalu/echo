import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/auth/login');
  await expect(page.getByRole('button', { name: 'Sign up with Google' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign up with Github' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign up with Azure' })).toBeVisible();
  await expect(page.locator('body')).toContainText('Sign in');
  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - heading "Sign up for free" [level=1]
    - button "Sign up with Google":
      - img
    - button "Sign up with Github":
      - img
    - button "Sign up with Azure":
      - img
    - textbox "What is your email address?"
    - textbox "Password"
    - textbox "Confirm password"
    - button "Sign up" [disabled]
    - text: Already have an account? Sign in
    `);
});
