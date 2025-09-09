import dayjs from 'dayjs';

/**
 * Calculates milliseconds until a Unix timestamp
 * @param timestamp Unix timestamp in seconds
 * @returns Milliseconds until timestamp (can be negative if timestamp is in the past)
 */
export const millisecondsFromUnixTimestamp = (timestamp = 0) => {
  return (timestamp - dayjs().unix()) * 1000;
};

/**
 * Converts a Unix timestamp to absolute milliseconds
 * @param timestamp Unix timestamp in seconds
 * @returns Absolute timestamp in milliseconds
 */
export const unixTimestampToMilliseconds = (timestamp = 0) => {
  return timestamp * 1000;
};
