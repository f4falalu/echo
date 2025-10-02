import { createServerFileRoute } from '@tanstack/react-start/server';
import { chromium } from 'playwright';
import { z } from 'zod';
import { Route as MetricContentRoute } from './_content/metrics.$metricId.content';

export const GetMetricScreenshotParamsSchema = z.object({
  metricId: z.string(),
});

export const GetMetricScreenshotQuerySchema = z.object({
  version_number: z.coerce.number().min(1).optional(),
  width: z.coerce.number().min(100).max(3840).default(800),
  height: z.coerce.number().min(100).max(2160).default(450),
  type: z.enum(['png', 'jpeg']).default('png'),
});

export const ServerRoute = createServerFileRoute('/screenshots/metrics/$metricId/').methods({
  GET: async ({ request, params }) => {
    console.time('capture screenshot');
    const { metricId } = GetMetricScreenshotParamsSchema.parse(params);
    const { version_number, type, width, height } = GetMetricScreenshotQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams)
    );
    const origin = new URL(request.url).origin;
    console.timeLog('capture screenshot', 'params parsed');
    const browser = await chromium.launch();
    console.timeLog('capture screenshot', 'browser launched');
    try {
      const page = await browser.newPage({
        viewport: { width, height },
      });
      console.timeLog('capture screenshot', 'page created');

      const fullPath = `${origin}${MetricContentRoute.fullPath}`;
      await page.goto(fullPath, { waitUntil: 'networkidle' });
      console.timeLog('capture screenshot', 'page navigated');
      const screenshotBuffer = await page.screenshot({
        type,
      });
      console.timeLog('capture screenshot', 'screenshot taken');
      console.timeEnd('capture screenshot');
      return new Response(new Uint8Array(screenshotBuffer), {
        headers: {
          'Content-Type': 'image/png',
          'Content-Length': screenshotBuffer.length.toString(),
        },
      });
    } catch (error) {
      //  console.error('Error capturing metric screenshot', error);
      return new Response(
        JSON.stringify({
          message: 'Failed to capture screenshot',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    } finally {
      await browser.close();
    }
  },
});
