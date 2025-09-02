
import { createBrowserClient as createBrowserClientSSR } from '@supabase/ssr';
import { env } from '@/env';

function createBrowserClient() {
  const supabaseUrl = env.VITE_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.VITE_PUBLIC_SUPABASE_ANON_KEY;

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
