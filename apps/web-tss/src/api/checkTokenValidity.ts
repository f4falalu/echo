import { jwtDecode } from 'jwt-decode';
import { openErrorNotification } from '../context/BusterNotifications';
import { getBrowserClient } from '../integrations/supabase/client';
import { getSupabaseSession } from '../integrations/supabase/getSupabaseUserClient';
import { millisecondsFromUnixTimestamp } from '../lib/timestamp';

const PREEMTIVE_REFRESH_MINUTES = 5;

const supabase = getBrowserClient();

export const checkTokenValidity = async () => {
  const { isAnonymousUser, accessToken, user } = await getSupabaseSession();

  if (!accessToken) {
    console.warn('No access token found in supabase session', user);
  }

  if (isAnonymousUser) {
    return {
      access_token: accessToken,
      isTokenValid: true,
    };
  }

  const msUntilExpiration = getExpiresAt(accessToken);
  const minutesUntilExpiration = msUntilExpiration / 60000;
  const needsPreemptiveRefresh = minutesUntilExpiration < PREEMTIVE_REFRESH_MINUTES;

  if (needsPreemptiveRefresh) {
    try {
      const { data: refreshedSession, error: refreshedSessionError } =
        await supabase.auth.refreshSession();

      if (refreshedSessionError || !refreshedSession.session) {
        throw refreshedSessionError || new Error('Failed to refresh session');
      }

      const refreshedAccessToken = refreshedSession.session.access_token;

      return {
        access_token: refreshedAccessToken,
        isTokenValid: true,
      };
    } catch (e) {
      console.error(e);
      openErrorNotification({
        title: 'Error validating your user authentication',
        description: 'Please refresh the page and try again',
        duration: 10 * 1000, //10 seconds
      });
    }
  }

  return {
    access_token: accessToken,
    isTokenValid: true,
  };
};

const getExpiresAt = (token: string | undefined) => {
  try {
    const decoded = jwtDecode(token || '');
    const expiresAtDecoded = (decoded as { exp?: number } | undefined)?.exp ?? 0;
    const expiresAtMs = millisecondsFromUnixTimestamp(expiresAtDecoded);
    return expiresAtMs;
  } catch {
    console.error('Error decoding token', token);
    // If token is missing/invalid, report that it is effectively expired now
    return 0;
  }
};
