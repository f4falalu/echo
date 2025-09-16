import { createServerFn } from '@tanstack/react-start';
import { getSupabaseServerClient } from '@/integrations/supabase/server';

export const getSupabaseSessionServerFn = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const supabase = getSupabaseServerClient();

    // Wrap the auth operation to catch any async errors
    const sessionData = await supabase.auth.getSession().catch((error) => {
      // Handle headers already sent errors gracefully
      if (error instanceof Error && error.message.includes('ERR_HTTP_HEADERS_SENT')) {
        console.warn('Headers already sent when getting session, returning null session');
        return {
          data: { session: null },
          error: null,
        };
      }
      // Re-throw other errors
      throw error;
    });

    const session = sessionData.data?.session;
    const sessionError = sessionData.error;
    const pickedSession = {
      access_token: session?.access_token,
      expires_at: session?.expires_at,
      expires_in: session?.expires_in,
    };

    return {
      data: {
        session: pickedSession,
      },
      error: sessionError,
    };
  } catch (error) {
    // Final catch-all for any unhandled errors
    if (error instanceof Error && error.message.includes('ERR_HTTP_HEADERS_SENT')) {
      console.warn('Headers already sent error in session handler, returning empty session');
      return {
        data: {
          session: {
            access_token: undefined,
            expires_at: undefined,
            expires_in: undefined,
          },
        },
        error: null,
      };
    }
    throw error;
  }
});

export const getSupabaseUserServerFn = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = getSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const pickedUser = {
    id: userData.user?.id ?? '',
    email: userData.user?.email ?? '',
    is_anonymous: userData.user?.is_anonymous ?? true,
  };

  return {
    data: {
      user: pickedUser,
    },
    error: userError,
  };
});
