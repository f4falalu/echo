import { createServerFileRoute } from '@tanstack/react-start/server';
import { z } from 'zod';
import { browserLogin } from '@/api/server-functions/screenshots/browser-login';
import { getSupabaseServerClient } from '@/integrations/supabase/server';
import { createHrefFromLink } from '@/lib/routes';

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

    const { browser, page } = await browserLogin({
      accessToken,
      width,
      height,
      fullPath: createHrefFromLink({
        to: '/screenshots/metrics/$metricId/content',
        params: { metricId },
        search: { version_number, type, width, height },
      }),
      request,
    });

    try {
      const screenshotBuffer = await page.screenshot({
        type,
      });

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
      console.error('Error capturing metric screenshot', error);
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
