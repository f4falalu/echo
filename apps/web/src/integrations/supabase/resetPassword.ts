import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { env } from '@/env';
import { ServerRoute as AuthCallbackRoute } from '../../routes/auth.callback';
import { Route as AuthResetPasswordRoute } from '../../routes/auth.reset-password';
import { getSupabaseServerClient } from './server';

export const resetPasswordEmailSend = createServerFn({ method: 'POST' })
  .validator(z.object({ email: z.string().email() }))
  .handler(async ({ data: { email } }) => {
    const supabase = await getSupabaseServerClient();
    const url = env.VITE_PUBLIC_URL;

    const authURLFull = `${url}${AuthResetPasswordRoute.to}`;

    console.log('email', email);
    console.log('authURLFull', authURLFull);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authURLFull,
    });

    if (error) {
      throw new Error(error.message);
    }

    return;
  });

export const resetPassword = createServerFn({ method: 'POST' })
  .validator(z.object({ password: z.string() }))
  .handler(async ({ data: { password } }) => {
    const supabase = await getSupabaseServerClient();

    const { data: user } = await supabase.auth.getUser();

    if (!user?.user) {
      throw new Error('User not found');
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return { error: error.message };
    }

    return;
  });
