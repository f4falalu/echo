import { createServerFileRoute } from '@tanstack/react-start/server';
import { z } from 'zod';
import { env } from '@/env';
import { getSupabaseServerClient } from '../integrations/supabase/server';
import { Route as AppHomeRoute } from './app/_app/home';

// Define the search parameters schema for type safety
const searchParamsSchema = z.object({
  code: z.string().optional(),
  code_challenge: z.string().optional(),
  next: z.string().optional(),
});

// Type for the validated search parameters
type SearchParams = z.infer<typeof searchParamsSchema>;

export const ServerRoute = createServerFileRoute('/auth/callback').methods({
  GET: async ({ request }) => {
    // Parse query parameters from the URL
    const url = new URL(request.url);

    // Extract and validate search parameters
    const searchParams: SearchParams = {
      code: url.searchParams.get('code') || undefined,
      code_challenge: url.searchParams.get('code_challenge') || undefined,
      next: url.searchParams.get('next') || AppHomeRoute.to || '/app/home',
    };

    // Validate the parameters (optional - provides runtime validation)
    const validatedParams = searchParamsSchema.parse(searchParams);

    const code = validatedParams.code_challenge || validatedParams.code;
    const next = validatedParams.next || AppHomeRoute.to || '/app/home';

    if (!code) {
      console.error('No exchange code found');
      return new Response('Missing code exchange code', { status: 400 });
    }

    if (!next) {
      console.error('No next URL found');
    }

    const supabase = await getSupabaseServerClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error exchanging code for session', error);
      return new Response('Error exchanging code for session', { status: 500 });
    }

    const forwardedHost = request.headers.get('x-forwarded-host');
    const origin = request.headers.get('origin') || env.VITE_PUBLIC_URL || '';
    const isLocalEnv = import.meta.env.DEV;

    if (isLocalEnv) {
      const redirectPath = next?.startsWith('/') ? next : AppHomeRoute.to || '/app/home';
      return new Response(null, {
        status: 302,
        headers: { Location: `${origin}${redirectPath}` },
      });
    }

    if (forwardedHost) {
      return new Response(null, {
        status: 302,
        headers: { Location: `https://${forwardedHost}${next}` },
      });
    }

    return new Response(null, {
      status: 302,
      headers: { Location: `${origin}${next}` },
    });
  },
});
