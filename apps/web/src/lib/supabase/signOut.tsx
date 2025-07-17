'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import { createSupabaseServerClient } from './server';

export const signOut = async () => {
  'use server';
  const supabase = await createSupabaseServerClient();
  const cookieStore = cookies();

  // Clear all cookies
  const allCookies = cookieStore.getAll();
  for (const cookie of allCookies) {
    cookieStore.delete(cookie.name);
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  return redirect(
    createBusterRoute({
      route: BusterRoutes.AUTH_LOGIN
    })
  );
};
