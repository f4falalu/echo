import { openErrorNotification } from '@/context/BusterNotifications';
import { getBrowserClient } from '@/integrations/supabase/client';
import { getSupabaseSession } from '@/integrations/supabase/getSupabaseUserClient';
import { isTokenAlmostExpired } from './expiration-helpers';

const supabase = getBrowserClient();

export const checkTokenValidity = async () => {
  const { expiresAt, accessToken } = await getSupabaseSession();

  if (isTokenAlmostExpired(expiresAt)) {
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
