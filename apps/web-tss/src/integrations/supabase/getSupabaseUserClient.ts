import cookies from 'js-cookie';
import { getBrowserClient } from './client';

const supabase = getBrowserClient();

export const getSupabaseSession = async () => {
  // console.time('getSupabaseSession');
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession(); //10 - 15ms locally, maybe consider getting it from the cookie instead. console the supabase object it had it there.
  // console.timeEnd('getSupabaseSession');

  if (!sessionData?.session || sessionError) {
    throw new Error('No session data found');
  }

  return {
    isAnonymousUser: !!sessionData.session?.user?.is_anonymous,
    accessToken: sessionData.session?.access_token,
    user: sessionData.session?.user,
  };
};
