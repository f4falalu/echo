import type { User } from '@supabase/supabase-js';
import { createServerFn } from '@tanstack/react-start';
import { getSupabaseServerClient } from './server';
import { signInWithAnonymousUser } from './signIn';

// Serializable subset of Supabase User compatible with server function constraints
export type AuthUserDTO = {
  id: string;
  email?: string;
  phone?: string;
  created_at: string;
  role?: string;
  is_anonymous: boolean;
};

function transformToAuthUserDTO(user: User): AuthUserDTO {
  return {
    id: user.id,
    email: user.email,
    created_at: user.created_at,
    is_anonymous: user.is_anonymous ?? false,
  };
}

export const getSupabaseUser = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = getSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    const anon = await signInWithAnonymousUser();

    if (!anon || !anon.success || !anon.data) {
      const anonError = anon && !anon.success ? anon.error : 'Unknown anonymous sign-in error';
      console.error('Error creating anon session:', anonError);
      throw new Error('Error creating anon session');
    }

    return {
      user: {
        is_anonymous: true,
        id: anon.data.user?.id ?? '',
        email: anon.data.user?.email ?? '',
        created_at: anon.data.user?.created_at ?? '',
      } satisfies AuthUserDTO,
      accessToken: anon.data.accessToken,
    } as { user: AuthUserDTO; accessToken: string };
  }

  // Get the session first
  const sessionResult = await supabase.auth.getSession();
  const sessionData = sessionResult.data;

  const user = transformToAuthUserDTO(userData.user);
  const accessToken = sessionData.session?.access_token;

  return {
    user,
    accessToken,
  } as { user: AuthUserDTO; accessToken: string };
});
