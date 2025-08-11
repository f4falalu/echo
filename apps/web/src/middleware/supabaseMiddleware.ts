import { createServerClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({
            request
          });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        }
      }
    }
  );

  // Get the session data first
  const { data: sessionData } = await supabase.auth.getSession();

  // Preemptively refresh if expiring soon (within 5 minutes)
  if (sessionData.session?.expires_at) {
    const expiresAtTimestamp = sessionData.session.expires_at * 1000; // ms
    const now = Date.now();
    const timeUntilExpiry = expiresAtTimestamp - now;
    const refreshWindowMs = 5 * 60 * 1000; // 5 minutes

    if (timeUntilExpiry < refreshWindowMs) {
      await supabase.auth.refreshSession();
    }
  }

  // Get the user (this will use the refreshed session if we refreshed it)
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return [supabaseResponse, user] as [NextResponse, User | null];
}
