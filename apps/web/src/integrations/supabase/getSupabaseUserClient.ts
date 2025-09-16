import type { AuthError } from '@supabase/supabase-js';
import { isTokenAlmostExpired } from '@/api/auth_helpers/expiration-helpers';
import {
  extractSimplifiedSupabaseSession,
  getSupabaseSessionServerFn,
  getSupabaseUserServerFn,
} from '@/api/server-functions/getSupabaseSession';
import { isServer } from '@/lib/window';
import { getSupabaseCookieClient } from '../../api/auth_helpers/cookie-helpers';
import { getBrowserClient } from './client';

const supabase = getBrowserClient();

export type SimplifiedSupabaseSession = {
  accessToken: string;
  isExpired: boolean;
  expiresAt: number;
  expiresIn: number;
};

export const getSupabaseSession = async (): Promise<SimplifiedSupabaseSession> => {
  const { data: sessionData, error: sessionError } = isServer
    ? await getSupabaseSessionServerFn()
    : await getClientSupabaseSessionFast();

  if ((!sessionData.accessToken || sessionError) && !isServer) {
    return sessionData;
  }

  return sessionData;
};

const getClientSupabaseSessionFast = async (): Promise<{
  data: SimplifiedSupabaseSession;
  error: null | AuthError;
}> => {
  // try {
  //   const cookieRes = await getSupabaseCookieClient();
  //   const almostExpired = isTokenAlmostExpired(cookieRes.expiresAt);
  //   if (!almostExpired) {
  //     return {
  //       data: cookieRes satisfies SimplifiedSupabaseSession,
  //       error: null,
  //     };
  //   }
  // } catch (error) {
  //   console.error('error in getClientSupabaseSessionFast', error);
  // }

  return extractSimplifiedSupabaseSession(supabase);
};

export const getSupabaseUser = async () => {
  const { data: userData } = isServer
    ? await getSupabaseUserServerFn()
    : await supabase.auth.getUser();
  return userData.user;
};
