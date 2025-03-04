'use server';

import { createClient } from '@/context/Supabase/server';
import { createBusterRoute, BusterRoutes } from '@/routes';
import { QueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { redirect } from 'next/navigation';

export const signOut = async () => {
  'use server';
  const supabase = await createClient();
  const queryClient = new QueryClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  setTimeout(() => {
    Object.keys(Cookies.get()).forEach((cookieName) => {
      Cookies.remove(cookieName);
    });
    queryClient.clear();
  }, 650);

  return redirect(
    createBusterRoute({
      route: BusterRoutes.AUTH_LOGIN
    })
  );
};
