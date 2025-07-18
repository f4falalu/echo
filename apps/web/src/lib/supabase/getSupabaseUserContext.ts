'use server';

import { createSupabaseServerClient } from './server';
import { signInWithAnonymousUser } from './signIn';

type PromiseType<T extends Promise<unknown>> = T extends Promise<infer U> ? U : never;

export type UseSupabaseUserContextType = PromiseType<ReturnType<typeof getSupabaseUserContext>>;

export const getSupabaseUserContext = async (preemptiveRefreshMinutes = 5) => {
  const supabase = await createSupabaseServerClient();

  // Get the session first
  const sessionResult = await supabase.auth.getSession();
  let sessionData = sessionResult.data;
  const sessionError = sessionResult.error;

  if (sessionError) {
    console.error('Error getting session:', sessionError);
  }

  // Check if we need to refresh the session
  if (sessionData.session) {
    const refreshedSessionData = (await refreshSessionIfNeeded(
      supabase,
      sessionData.session,
      preemptiveRefreshMinutes
    )) as Awaited<ReturnType<typeof refreshSessionIfNeeded>>;

    // If session was refreshed, get the updated session
    if (refreshedSessionData && 'session' in refreshedSessionData) {
      // Replace the entire sessionData object to avoid type issues
      sessionData = refreshedSessionData;
    }
  }

  // Get user data
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    console.error('Error getting user:', userData, userError);
  }

  if (!userData.user) {
    const { session: anonSession } = await signInWithAnonymousUser();
    console.info('created anon session', anonSession);
    return {
      user: anonSession?.user || null,
      accessToken: anonSession?.access_token
    };
  }

  const user = userData.user;
  const accessToken = sessionData.session?.access_token;
  const refreshToken = sessionData.session?.refresh_token;

  if (!accessToken) {
    console.error('No access token found for user:', user);
  }

  return { user, accessToken, refreshToken };
};

/**
 * Helper function to refresh the session if it's about to expire (less than 50 minutes)
 * Returns true if session was refreshed, false otherwise
 */
const refreshSessionIfNeeded = async (
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  session: NonNullable<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']>,
  preemptiveRefreshMinutes = 5
): Promise<false | Awaited<ReturnType<typeof supabase.auth.getSession>>['data']> => {
  // Calculate if session is about to expire (less than 50 minutes)
  const expiresAt = session.expires_at;
  if (!expiresAt) {
    return false;
  }

  const expiresAtTimestamp = expiresAt * 1000; // Convert to milliseconds
  const now = Date.now();
  const timeUntilExpiry = expiresAtTimestamp - now;
  const preemptiveRefreshInMs = preemptiveRefreshMinutes * 60 * 1000;

  // If session expires in less than X minutes, refresh it
  if (timeUntilExpiry < preemptiveRefreshInMs) {
    const { data, error } = await supabase.auth.refreshSession();

    if (error || !data.session) {
      console.error('Failed to refresh session:', error);
      return false;
    }

    // Session was successfully refreshed
    return data;
  }

  return false;
};
