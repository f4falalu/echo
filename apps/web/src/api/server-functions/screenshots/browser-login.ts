import { chromium } from 'playwright';
import { env } from '@/env';
import { getSupabaseServerClient } from '@/integrations/supabase/server';

export const browserLogin = async ({
  accessToken,
  width,
  height,
  fullPath,
  request,
}: {
  accessToken: string;
  width: number;
  height: number;
  fullPath: string;
  request: Request;
}) => {
  const supabase = getSupabaseServerClient();
  const jwtPayload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString());
  const origin = new URL(request.url).origin;

  const {
    data: { user },
  } = await supabase.auth.getUser(accessToken);

  if (!user || user?.is_anonymous) {
    throw new Error('User not found');
  }

  const session = {
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: jwtPayload.exp,
    refresh_token: '',
    user: user,
  };

  const browser = await chromium.launch();

  try {
    const context = await browser.newContext({
      viewport: { width, height },
    });

    const cookieKey = (supabase as unknown as { storageKey: string }).storageKey;

    // Format cookie value as Supabase expects: base64-<encoded_session>
    const cookieValue = `base64-${Buffer.from(JSON.stringify(session)).toString('base64')}`;

    await context.addCookies([
      {
        name: cookieKey,
        value: cookieValue,
        domain: new URL(env.VITE_PUBLIC_URL).hostname,
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
      },
    ]);

    const page = await context.newPage();
    const fullPathWithOrigin = `${origin}${fullPath}`;

    page.on('console', (msg) => {
      const hasError = msg.type() === 'error';
      if (hasError) {
        browser.close();
        throw new Error(`Error in browser: ${msg.text()}`);
      }
    });

    await page.goto(fullPathWithOrigin, { waitUntil: 'networkidle' });

    return { context, browser, page };
  } catch (error) {
    console.error('Error logging in to browser', error);
    await browser.close();
    throw error;
  }
};
