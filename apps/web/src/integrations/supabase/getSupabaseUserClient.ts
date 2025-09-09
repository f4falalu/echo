import { isTokenExpired } from '@/api/auth_helpers/expiration-helpers';
import {
  getSupabaseSessionServerFn,
  getSupabaseUserServerFn,
} from '@/api/server-functions/getSupabaseSession';
import { isServer } from '@/lib/window';
import { getBrowserClient } from './client';

const supabase = getBrowserClient();

export const getSupabaseSession = async () => {
  const { data: sessionData, error: sessionError } = isServer
    ? await getSupabaseSessionServerFn()
    : await supabase.auth.getSession(); //10 - 15ms locally, maybe consider getting it from the cookie instead. console the supabase object it had it there.

  if ((!sessionData?.session || sessionError) && !isServer) {
    throw new Error('No session data found');
  }

  const isExpired = isTokenExpired(sessionData.session?.expires_at);

  return {
    accessToken: sessionData.session?.access_token,
    isExpired,
    expiresAt: sessionData.session?.expires_at,
  };
};

export const getSupabaseUser = async () => {
  const { data: userData } = isServer
    ? await getSupabaseUserServerFn()
    : await supabase.auth.getUser();
  return userData.user;
};
