import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { env } from '@/env';
import { ServerRoute as AuthCallbackRoute } from '../../routes/auth.callback';
import { getSupabaseServerClient } from './server';

export const resetPasswordEmailSend = createServerFn({ method: 'POST' })
  .validator(z.object({ email: z.string().email() }))
  .handler(async ({ data: { email } }) => {
    const supabase = await getSupabaseServerClient();
    const url = env.VITE_PUBLIC_URL;

    const authURLFull = `${url}${AuthCallbackRoute.to}`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authURLFull
    });

    if (error) {
      return { error: error.message };
    }

    return;
  });

export const resetPassword = createServerFn({ method: 'POST' })
  .validator(z.object({ password: z.string() }))
  .handler(async ({ data: { password } }) => {
    const supabase = await getSupabaseServerClient();

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return { error: error.message };
    }

    return;
  });
