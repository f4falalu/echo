'use server';

import { createClient } from '@/context/Supabase/server';
import { redirect } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes/busterRoutes';
import Cookies from 'js-cookie';
import { QueryClient } from '@tanstack/react-query';

export const signOut = async () => {
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
