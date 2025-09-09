import { redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { parseCookies, setCookie } from '@tanstack/react-start/server';
import { getSupabaseServerClient } from './server';

export const signOut = createServerFn({ method: 'POST' }).handler(async () => {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  throw redirect({
    href: '/',
  });
});
