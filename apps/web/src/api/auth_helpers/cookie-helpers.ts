import type { SimplifiedSupabaseSession } from '@/integrations/supabase/getSupabaseUserClient';
import { isTokenExpired } from './expiration-helpers';

let supabaseCookieName = '';

// Export for testing purposes only
export function resetSupabaseCookieNameCache() {
  supabaseCookieName = '';
}

export function parseBase64Cookie(cookieValue: string): SimplifiedSupabaseSession | null {
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

  let jsonStr: string = '';

  try {
    jsonStr = atob(payload);
  } catch (error) {
    // Handle invalid base64 (truncated cookie from Supabase)
    console.error('Failed to decode base64:', error);

    // Try to decode what we can - the cookie might be truncated
    let trimmedPayload = payload;

    // If the base64 ends with incomplete padding, fix it
    while (trimmedPayload.length > 0) {
      try {
        jsonStr = atob(trimmedPayload);
        console.log('Decoded truncated base64 successfully');
        break;
      } catch {
        // Remove last character and try again
        trimmedPayload = trimmedPayload.slice(0, -1);
      }
    }

    if (!jsonStr) {
      return null;
    }
  }

  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to parse JSON:', error);

    // Try to handle truncated JSON from Supabase
    if (error instanceof SyntaxError && jsonStr) {
      try {
        // Try to extract the essential fields even if JSON is truncated
        // Look for the access_token which is usually complete
        const accessTokenMatch = jsonStr.match(/"access_token"\s*:\s*"([^"]+)"/);
        const expiresAtMatch = jsonStr.match(/"expires_at"\s*:\s*(\d+)/);
        const expiresInMatch = jsonStr.match(/"expires_in"\s*:\s*(\d+)/);
        const tokenTypeMatch = jsonStr.match(/"token_type"\s*:\s*"([^"]+)"/);
        const userIdMatch = jsonStr.match(/"user"\s*:\s*\{[^}]*"id"\s*:\s*"([^"]+)"/);
        const userEmailMatch = jsonStr.match(/"user"\s*:\s*\{[^}]*"email"\s*:\s*"([^"]+)"/);

        if (
          accessTokenMatch &&
          expiresAtMatch &&
          expiresInMatch &&
          tokenTypeMatch &&
          userIdMatch &&
          userEmailMatch
        ) {
          // Reconstruct a minimal valid session object
          return {
            accessToken: accessTokenMatch[1],
            expiresAt: parseInt(expiresAtMatch[1], 10),
            expiresIn: parseInt(expiresInMatch[1], 10),
            isExpired: isTokenExpired(parseInt(expiresAtMatch[1], 10)),
            user: {
              id: userIdMatch[1],
              is_anonymous: false, // Default to false since we can't extract this
              email: userEmailMatch[1],
            },
          } satisfies SimplifiedSupabaseSession;
        }
      } catch (extractError) {
        console.error('Failed to extract data from truncated cookie:', extractError);
      }
    }

    return null;
  }
}

export const getSupabaseCookieClient = async (): Promise<SimplifiedSupabaseSession> => {
  try {
    const supabaseCookieRaw = await getSupabaseCookieRawClient();

    if (supabaseCookieRaw) {
      const decodedCookie = parseBase64Cookie(supabaseCookieRaw || '');
      if (decodedCookie) return decodedCookie;
    }
  } catch (error) {
    console.error('Failed to get supabase cookie:', error);
  }

  return {
    accessToken: '',
    expiresAt: 0,
    expiresIn: 0,
    isExpired: true,
    user: {
      id: '',
      is_anonymous: false,
      email: '',
    },
  };
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
  try {
    const getCookieByKey = (d: [string, string][]) => {
      const cookie = d.find(
        ([name, value]) =>
          name.startsWith('sb-') && name.includes('-auth-token') && value.startsWith('base64-')
      );
      supabaseCookieName = cookie?.[0] || '';
      return cookie?.[1];
    };

    if (supabaseCookieName) {
      const Cookies = await import('js-cookie').then((m) => m.default);
      return Cookies.get(supabaseCookieName);
    }

    return getCookieByKey(Object.entries(listAllCookies()));
  } catch (error) {
    console.error('Failed to get supabase cookie raw:', error);
    return '';
  }
}
