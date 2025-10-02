import { createServerFileRoute } from '@tanstack/react-start/server';
import { chromium } from 'playwright';
import { z } from 'zod';
import { getMetric } from '@/api/buster_rest/metrics';
import { env } from '@/env';
import { getSupabaseServerClient } from '@/integrations/supabase/server';
import { Route as MetricContentRoute } from './_content/metrics.$metricId.content';

const isDev = import.meta.env.DEV;

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
    const bearerToken = request.headers.get('Authorization') || '';
    const accessToken = bearerToken.replace('Bearer ', '');
    const supabase = getSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser(accessToken);

    if (!user || user.is_anonymous) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { metricId } = GetMetricScreenshotParamsSchema.parse(params);
    const { version_number, type, width, height } = GetMetricScreenshotQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams)
    );
    const origin = new URL(request.url).origin;

    // For Playwright, we need to reconstruct the session from the JWT
    // Decode the JWT to get expiry time
    const jwtPayload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString());

    const session = {
      access_token: accessToken,
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: jwtPayload.exp,
      refresh_token: '',
      user: user,
    };

    console.time('capture screenshot');

    const browser = await chromium.launch();
    console.timeLog('capture screenshot', 'browser launched');
    try {
      // Create browser context with authentication cookies
      const context = await browser.newContext({
        viewport: { width, height },
      });

      // Extract project ref from Supabase URL (e.g., "abcdefg" from "abcdefg.supabase.co")
      const projectRef = '127';

      // Format cookie value as Supabase expects: base64-<encoded_session>
      const cookieValue = `base64-${Buffer.from(JSON.stringify(session)).toString('base64')}`;

      console.log('Project ref:', projectRef);
      console.log('Cookie name:', `sb-${projectRef}-auth-token`);

      await context.addCookies([
        {
          name: `sb-${projectRef}-auth-token`,
          value: cookieValue,
          domain: new URL(env.VITE_PUBLIC_URL).hostname,
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'Lax',
        },
      ]);

      const page = await context.newPage();
      console.timeLog('capture screenshot', 'page created with auth cookie');

      const fullPath = `${origin}${MetricContentRoute.fullPath}`;
      await page.goto(fullPath, { waitUntil: 'networkidle' });
      console.timeLog('capture screenshot', 'page navigated');
      const screenshotBuffer = await page.screenshot({
        type,
      });
      console.timeLog('capture screenshot', 'screenshot taken');
      console.timeEnd('capture screenshot');

      if (!isDev) {
        return new Response(
          JSON.stringify({
            success: true,
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

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
