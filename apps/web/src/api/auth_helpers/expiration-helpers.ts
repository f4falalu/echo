import { millisecondsFromUnixTimestamp } from '@/lib/timestamp';

const PREEMTIVE_REFRESH_MINUTES = 5;

export const getExpiresAtMilliseconds = (expiresAt: number | undefined) => {
  return millisecondsFromUnixTimestamp(expiresAt ?? 0);
};

export const isTokenAlmostExpired = (
  expiresAt: number | undefined,
  preemptiveRefreshMinutes: number = PREEMTIVE_REFRESH_MINUTES
) => {
  const msUntilExpiration = getExpiresAtMilliseconds(expiresAt);
  console.log('msUntilExpiration', msUntilExpiration);
  const minutesUntilExpiration = msUntilExpiration / 60000;
  console.log('minutesUntilExpiration', minutesUntilExpiration);
  const needsPreemptiveRefresh = minutesUntilExpiration < preemptiveRefreshMinutes;
  console.log('needsPreemptiveRefresh', needsPreemptiveRefresh);
  return needsPreemptiveRefresh;
};

export const isTokenExpired = (expiresAt: number | undefined) => {
  const msUntilExpiration = getExpiresAtMilliseconds(expiresAt);
  const minutesUntilExpiration = msUntilExpiration / 60000;
  return minutesUntilExpiration <= 0;
};
