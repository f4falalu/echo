'use client';

import { GoTrueClient } from '@supabase/auth-js';
import { env } from '@/env';

// Define a minimal Supabase client type that only includes auth
type MinimalSupabaseClient = {
  auth: GoTrueClient;
};

function createBrowserClient(): MinimalSupabaseClient {
  const supabaseUrl = env.VITE_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.VITE_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables for browser client');
  }

  // Create only the auth client using GoTrueClient directly
  const authClient = new GoTrueClient({
    url: `${supabaseUrl}/auth/v1`,
    headers: {
      Authorization: `Bearer ${supabaseAnonKey}`,
      apikey: supabaseAnonKey,
    },
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Handle cookie storage for SSR compatibility
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  });

  // Return a minimal client structure that matches the expected interface
  return {
    auth: authClient,
  };
}

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export const getBrowserClient = () => {
  if (!browserClient) {
    browserClient = createBrowserClient();
  }
  return browserClient;
};
