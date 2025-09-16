let supabaseCookieName = '';

function parseJwt(payload: string) {
  // Remove the prefix if present
  if (payload.startsWith('base64-')) {
    payload = payload.slice(7);
  }
  // Convert base64url to base64
  payload = payload.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  while (payload.length % 4) {
    payload += '=';
  }
  // Decode and parse
  const jsonStr = atob(payload);
  return JSON.parse(jsonStr);
}

export const getSupabaseCookieClient = async () => {
  const supabaseCookieRaw = await getSupabaseCookieRawClient();

  const decodedCookie = parseJwt(supabaseCookieRaw || '') as {
    access_token: string;
    expires_at: number;
    expires_in: number;
    token_type: 'bearer';
    user: {
      id: string;
      is_anonymous: boolean;
      email: string;
    };
  };

  return decodedCookie;
};

function listAllCookies() {
  return Object.fromEntries(
    document.cookie.split('; ').map((cookieStr) => {
      const [name, ...rest] = cookieStr.split('=');
      return [name, rest.join('=')];
    })
  );
}

async function getSupabaseCookieRawClient() {
  const getCookieByKey = (d: [string, string][]) => {
    const cookie = d.find(([name]) => name.startsWith('sb-') && name.endsWith('-auth-token'));
    supabaseCookieName = cookie?.[0] || '';
    return cookie?.[1];
  };

  if (supabaseCookieName) {
    const Cookies = await import('js-cookie').then((m) => m.default);
    return Cookies.get(supabaseCookieName);
  }
  return getCookieByKey(Object.entries(listAllCookies()));
}
