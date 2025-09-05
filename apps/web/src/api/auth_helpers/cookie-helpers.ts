import { parse } from '@supabase/ssr';
import { parseCookies } from '@tanstack/react-start/server';
import { jwtDecode } from 'jwt-decode';
import { getExpiresAtMilliseconds } from './expiration-helpers';

export const checkTokenValidityFromToken = (token: string | undefined) => {
  const decoded = decodeJwtToken(token);
  console.log('decoded', decoded);
};

export const decodeJwtToken = (token: string | undefined) => {
  try {
    const decoded = jwtDecode(token || '');
    return decoded as { exp?: number };
  } catch {
    console.error('Error decoding token', token);
    return null;
  }
};

export const getExpiresAtFromToken = (token: string | undefined) => {
  try {
    const expiresAtDecoded = decodeJwtToken(token)?.exp ?? 0;
    return getExpiresAtMilliseconds(expiresAtDecoded);
  } catch {
    console.error('Error decoding token', token);
    // If token is missing/invalid, report that it is effectively expired now
    return 0;
  }
};

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

export const getSupabaseCookie = () => {
  const supabaseCookieRaw = Object.entries(parseCookies()).find(
    ([name]) => name.startsWith('sb-') && name.endsWith('-auth-token')
  )?.[1];
  if (!supabaseCookieRaw) {
    return '';
  }

  try {
    const decodedCookie = parseJwt(supabaseCookieRaw);
  } catch (error) {
    console.error('nope');
  }

  return '';
};
