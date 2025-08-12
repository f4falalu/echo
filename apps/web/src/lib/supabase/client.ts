'use client';

import { createBrowserClient as createBrowserClientSSR } from '@supabase/ssr';

function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables for browser client');
  }

  return createBrowserClientSSR(supabaseUrl, supabaseAnonKey);
}

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export const getBrowserClient = () => {
  if (!browserClient) {
    browserClient = createBrowserClient();
  }
  return browserClient;
};
