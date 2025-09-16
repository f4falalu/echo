let supabaseCookieName = '';

export function parseBase64Cookie(cookieValue: string) {
  if (!cookieValue) {
    return null;
  }

  let payload = cookieValue;

  // Remove the base64- prefix if present
  if (payload.startsWith('base64-')) {
    payload = payload.slice(7);
  }

  // Convert base64url to base64
  payload = payload.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding if needed
  while (payload.length % 4) {
    payload += '=';
  }

  try {
    const jsonStr = atob(payload);
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to parse base64 cookie:', error);
    return null;
  }
}

export const getSupabaseCookieClient = async () => {
  const supabaseCookieRaw = await getSupabaseCookieRawClient();

  const decodedCookie = parseBase64Cookie(supabaseCookieRaw || '') as {
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

export async function getSupabaseCookieRawClient() {
  const getCookieByKey = (d: [string, string][]) => {
    const cookie = d.find(
      ([name, value]) =>
        name.startsWith('sb-') && name.endsWith('-auth-token') && value.startsWith('base64-')
    );
    supabaseCookieName = cookie?.[0] || '';
    return cookie?.[1];
  };

  if (supabaseCookieName) {
    const Cookies = await import('js-cookie').then((m) => m.default);
    return Cookies.get(supabaseCookieName);
  }
  return getCookieByKey(Object.entries(listAllCookies()));
}
