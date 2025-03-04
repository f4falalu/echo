import React from 'react';
import { ResetPasswordForm } from './_ResetPasswordForm';
import { resetPassword } from '@/hooks/supabaseAuthMethods';
import { redirect } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import { useSupabaseServerContext } from '@/context/Supabase/useSupabaseContext';
import { getMyUserInfo_server } from '@/api/buster_rest';

export default async function ResetPassword() {
  const supabaseContext = await useSupabaseServerContext();

  const { user } = supabaseContext;

  if (!user?.id) {
    return redirect(
      createBusterRoute({
        route: BusterRoutes.AUTH_LOGIN
      })
    );
  }

  const busterUser = await getMyUserInfo_server({ jwtToken: supabaseContext.accessToken });

  if (!busterUser?.user?.email) {
    return redirect(
      createBusterRoute({
        route: BusterRoutes.AUTH_LOGIN
      })
    );
  }

  return (
    <ResetPasswordForm resetPassword={resetPassword} supabaseUser={user} busterUser={busterUser} />
  );
}
