import { redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { env } from '@/env';
import { ServerRoute as AuthCallbackRoute } from '../../routes/auth.callback';
import { getSupabaseServerClient } from './server';

const isValidRedirectUrl = (url: string): boolean => {
  try {
    const decoded = decodeURIComponent(url);
    return decoded.startsWith('/') && !decoded.startsWith('//');
  } catch {
    return false;
  }
};

export const signInWithEmailAndPassword = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      email: z.string(),
      password: z.string(),
      redirectUrl: z.string().nullable().optional(),
    })
  )
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      return {
        error: true as const,
        message: error.message,
      };
    }

    return {
      error: false as const,
    };
  });

export const signInWithGoogle = createServerFn({ method: 'POST' })
  .validator(z.object({ redirectTo: z.string().nullable().optional() }))
  .handler(async ({ data: { redirectTo } }) => {
    const supabase = getSupabaseServerClient();

    const callbackUrl = new URL(AuthCallbackRoute.to, env.VITE_PUBLIC_URL);

    if (redirectTo && isValidRedirectUrl(redirectTo)) {
      callbackUrl.searchParams.set('next', redirectTo);
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    console.log('OAuth data:', data);

    return { success: true, url: data.url };
  });

export const signInWithAnonymousUser = createServerFn({ method: 'POST' }).handler(async () => {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    return { success: false, error: error.message };
  }

  const session = data.session;

  if (!session) {
    return { success: false, error: 'No session found' };
  }

  return {
    success: true,
    data: {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      user: session.user
        ? {
            id: session.user.id,
            email: session.user.email,
            app_metadata: session.user.app_metadata,
            user_metadata: session.user.user_metadata,
            aud: session.user.aud,
            confirmation_sent_at: session.user.confirmation_sent_at,
            recovery_sent_at: session.user.recovery_sent_at,
            email_change_sent_at: session.user.email_change_sent_at,
            invited_at: session.user.invited_at,
            action_link: session.user.action_link,
            email_confirmed_at: session.user.email_confirmed_at,
            phone_confirmed_at: session.user.phone_confirmed_at,
            last_sign_in_at: session.user.last_sign_in_at,
            phone: session.user.phone,
            created_at: session.user.created_at,
            updated_at: session.user.updated_at,
            role: session.user.role,
            deleted_at: session.user.deleted_at,
          }
        : null,
    },
  };
});

export const signInWithGithub = createServerFn({ method: 'POST' })
  .validator(z.object({ redirectTo: z.string().nullable().optional() }))
  .handler(async ({ data: { redirectTo } }) => {
    const supabase = getSupabaseServerClient();

    const callbackUrl = new URL(AuthCallbackRoute.to, env.VITE_PUBLIC_URL);

    if (redirectTo && isValidRedirectUrl(redirectTo)) {
      callbackUrl.searchParams.set('next', redirectTo);
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    throw redirect({ to: data.url });
  });

export const signInWithAzure = createServerFn({ method: 'POST' })
  .validator(z.object({ redirectTo: z.string().nullable().optional() }))
  .handler(async ({ data: { redirectTo } }) => {
    const supabase = getSupabaseServerClient();

    const callbackUrl = new URL(AuthCallbackRoute.to, env.VITE_PUBLIC_URL);

    if (redirectTo && isValidRedirectUrl(redirectTo)) {
      callbackUrl.searchParams.set('next', redirectTo);
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: callbackUrl.toString(),
        scopes: 'email',
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    throw redirect({ to: data.url });
  });

export const signUpWithEmailAndPassword = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      email: z.string(),
      password: z.string(),
      redirectTo: z.string().nullable().optional(),
    })
  )
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();

    const authURLFull = `${AuthCallbackRoute.to}`;

    console.log(data);

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: data.redirectTo || `${env.VITE_PUBLIC_URL}`,
      },
    });

    console.log('error', error);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('authURLFull', authURLFull);

    throw redirect({ to: authURLFull });
  });
