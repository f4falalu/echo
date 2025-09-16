import { isTokenAlmostExpired, isTokenExpired } from '@/api/auth_helpers/expiration-helpers';
import {
  getSupabaseSessionServerFn,
  getSupabaseUserServerFn,
} from '@/api/server-functions/getSupabaseSession';
import { isServer } from '@/lib/window';
import { getSupabaseCookieClient } from '../../api/auth_helpers/cookie-helpers';
import { getBrowserClient } from './client';

const supabase = getBrowserClient();

export const getSupabaseSession = async () => {
  const { data: sessionData, error: sessionError } = isServer
    ? await getSupabaseSessionServerFn()
    : await getClientSupabaseSessionFast();

  if ((!sessionData?.session || sessionError) && !isServer) {
    return {
      accessToken: '',
      isExpired: true,
      expiresAt: 0,
    };
  }

  const isExpired = isTokenExpired(sessionData.session?.expires_at);

  return {
    accessToken: sessionData.session?.access_token,
    isExpired,
    expiresAt: sessionData.session?.expires_at,
  };
};

const getClientSupabaseSessionFast = async () => {
  try {
    const cookieRes = await getSupabaseCookieClient();
    const almostExpired = isTokenAlmostExpired(cookieRes.expires_at);
    if (!almostExpired) {
      return {
        data: {
          session: {
            access_token: cookieRes.access_token,
            isExpired: false,
            expires_at: cookieRes.expires_at,
          },
        },
        error: null,
      };
    }
  } catch (error) {
    //fail silently
  }

  return await supabase.auth.getSession(); //100ms on server, that's why we're using the cookie instead.
};

export const getSupabaseUser = async () => {
  const { data: userData } = isServer
    ? await getSupabaseUserServerFn()
    : await getSupbaseUserFastClient();
  return userData.user;
};

async function getSupbaseUserFastClient() {
  const cookieRes = await getSupabaseCookieClient();
  const almostExpired = isTokenAlmostExpired(cookieRes.expires_at);

  if (!almostExpired) {
    return {
      data: {
        user: cookieRes.user,
      },
    };
  }

  return await supabase.auth.getUser();
}
