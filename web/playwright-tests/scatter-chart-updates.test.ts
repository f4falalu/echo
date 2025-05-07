import { test, expect } from '@playwright/test';

test.describe.serial('Create a scatter plot with a question', () => {
  const question = `I want to understand if there's a relationship between how much an employee sells and the number of orders they process. Can you generate a scatter plot showing each employee's total sales amount on one axis and their total number of orders on the other axis for the last 12 months?`;
  let scatterURL = '';
  test(`I can create a scatter plot with a question: ${question}`, async ({ page }) => {
    await page.goto('http://localhost:3000/app/home');
    await page.getByRole('textbox', { name: 'Ask Buster a question...' }).click();
    await page.getByRole('textbox', { name: 'Ask Buster a question...' }).fill(question);
    await page.getByRole('main').getByRole('button').click();
    await page.waitForTimeout(5000);
    await expect(page.getByRole('link', { name: 'Reasoning link' })).toBeVisible();
    await expect(page.getByTestId('metric-view-chart-content').getByRole('img')).toBeVisible({
      timeout: 240000
    });
    await expect(page.getByTestId('share-button')).toBeVisible();
    await expect(page.getByTestId('save-to-dashboard-button')).toBeVisible();
    await expect(page.getByTestId('edit-sql-button').getByRole('button')).toBeVisible();
    await expect(page.getByTestId('edit-chart-button').getByRole('button')).toBeVisible();

    await page.getByTestId('edit-chart-button').getByRole('button').click();
    await expect(page.getByTestId('select-chart-type-scatter')).toBeVisible();
    await expect(page.getByTestId('select-chart-type-scatter')).toHaveAttribute(
      'data-state',
      'selected'
    );

    const url = page.url();
    await page.goto(
      'http://localhost:3000/app/chats/21cd1170-7ecf-4796-9d5e-9828285c62ec/metrics/0023f1a3-58fe-53f7-9f23-07f20868e1b4/chart?secondary_view=chart-edit'
    );
    scatterURL = url;
  });

  scatterURL =
    'http://localhost:3000/app/chats/21cd1170-7ecf-4796-9d5e-9828285c62ec/metrics/0023f1a3-58fe-53f7-9f23-07f20868e1b4/chart';
  test(`I can update the scatter plot`, async ({ page }) => {
    await page.goto(scatterURL);

    await page.getByTestId('edit-chart-button').getByRole('button').click();
    await expect(page.getByTestId('select-chart-type-scatter')).toBeVisible();
    await expect(page.getByTestId('select-chart-type-scatter')).toHaveAttribute(
      'data-state',
      'selected'
    );
    await page.getByTestId('segmented-trigger-Styling').click();
    //
  });
});
