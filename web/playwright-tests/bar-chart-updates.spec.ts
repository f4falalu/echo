import { test, expect } from '@playwright/test';

test('Can load a bar chart', async ({ page }) => {
  await page.goto('http://localhost:3000/app/home');
  await page.getByRole('link', { name: 'Metrics', exact: true }).click();

  await page
    .getByRole('link', {
      name: 'Yearly Sales Revenue - Signature Cycles Products (Last 3 Years + YTD)'
    })
    .click();

  await expect(page.getByTestId('metric-view-chart-content')).toBeVisible();
  await expect(page.getByTestId('metric-view-chart-content').getByRole('img')).toBeVisible();

  //can remove x axis from bar chart
  await page.getByTestId('edit-chart-button').getByRole('button').click();
  await page.locator('.relative > button').first().click();
  await expect(page.getByText('No valid axis selected')).toBeVisible();

  //can drag a numeric column to x axis

  const sourceElement = page
    .getByTestId('select-axis-available-items-list')
    .getByRole('button')
    .first();
  expect(sourceElement).toBeVisible();

  const targetElement = page
    .getByTestId('select-axis-drop-zone-xAxis')
    .locator('div')
    .filter({ hasText: /^Drag column here$/ });
  expect(targetElement).toBeVisible();

  const sourceBoundingBox = await sourceElement.boundingBox();
  const targetBoundingBox = await targetElement.boundingBox();

  if (sourceBoundingBox && targetBoundingBox) {
    // Start at the center of the source element
    await page.mouse.move(
      sourceBoundingBox.x + sourceBoundingBox.width / 2,
      sourceBoundingBox.y + sourceBoundingBox.height / 2
    );
    await page.mouse.down();

    // Move to target in small increments
    const steps = 50;
    const dx = (targetBoundingBox.x - sourceBoundingBox.x) / steps;
    const dy = (targetBoundingBox.y - sourceBoundingBox.y) / steps;

    for (let i = 0; i <= steps; i++) {
      await page.mouse.move(
        sourceBoundingBox.x + dx * i + sourceBoundingBox.width / 2,
        sourceBoundingBox.y + dy * i + sourceBoundingBox.height / 2,
        { steps: 1 }
      );
      await page.waitForTimeout(1); // Add a small delay between each movement
    }

    await page.mouse.up();
  }

  await expect(
    page.getByTestId('select-axis-drop-zone-xAxis').getByRole('button', { name: 'Year' })
  ).toBeVisible();

  //can drag to availabel from x axis

  {
    const sourceElement = page
      .getByTestId('select-axis-drop-zone-xAxis')
      .getByRole('button', { name: 'Year' });
    expect(sourceElement).toBeVisible();
    const targetElement = page
      .getByTestId('select-axis-available-items-list')
      .getByRole('button')
      .first();
    expect(targetElement).toBeVisible();

    // Click and hold before dragging
    await sourceElement.click({ button: 'left', delay: 500 });
    await sourceElement.hover();
    await page.mouse.down();
    await targetElement.hover();
    await page.mouse.up();

    await expect(
      page.getByTestId('select-axis-drop-zone-xAxis').getByRole('button', { name: 'Year' })
    ).not.toBeVisible();
  }
});
