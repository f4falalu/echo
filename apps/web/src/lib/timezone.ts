import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import Cookies from 'js-cookie';
import { getServerCookie } from '@/api/server-functions/getServerCookie';
import { isServer } from './window';

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE_COOKIE_KEY = 'client-timezone';
const TIMEZONE_COOKIE_EXPIRY = 30; // 30 days

/**
 * Get the client's timezone from browser API
 */
export const detectClientTimezone = (): string => {
  if (isServer) return '';

  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return '';
  }
};

/**
 * Store the client's timezone in a cookie
 */
export const setTimezoneInCookie = (timezone: string): void => {
  if (isServer || !timezone) return;

  Cookies.set(TIMEZONE_COOKIE_KEY, timezone, {
    expires: TIMEZONE_COOKIE_EXPIRY,
    sameSite: 'lax',
    secure: true,
  });
};

/**
 * Get timezone from cookie (works on both server and client)
 */
export const getTimezoneFromCookie = async (): Promise<string | null> => {
  if (isServer) {
    const cookieData = await getServerCookie({ data: { cookieName: TIMEZONE_COOKIE_KEY } });
    return cookieData || null;
  }

  return Cookies.get(TIMEZONE_COOKIE_KEY) || null;
};

/**
 * Initialize client timezone detection and storage
 * Call this once on client mount
 */
export const initializeClientTimezone = async () => {
  if (isServer) return;

  const storedTimezone = await getTimezoneFromCookie();
  const currentTimezone = detectClientTimezone();

  // Only update cookie if timezone has changed or is missing
  if (!storedTimezone || storedTimezone !== currentTimezone) {
    setTimezoneInCookie(currentTimezone);
  }
};

/**
 * Get current time in the client's timezone (or fallback to local time)
 */
export const getCurrentTimeInClientTimezone = async (): Promise<dayjs.Dayjs> => {
  const clientTimezone = await getTimezoneFromCookie();

  if (clientTimezone) {
    return dayjs().tz(clientTimezone);
  }

  // Fallback to local time if no timezone available
  return dayjs();
};
