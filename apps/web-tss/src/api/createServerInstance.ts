import { createServerFn } from '@tanstack/react-start';

import { getSupabaseServerClient } from '@/integrations/supabase/server';

export const getSupabaseAccessTokenServerFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const supabase = getSupabaseServerClient();
    const sessionData = await supabase.auth.getSession();
    const accessToken = sessionData.data?.session?.access_token;
    return accessToken;
  }
);
