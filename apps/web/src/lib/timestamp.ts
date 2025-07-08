import dayjs from 'dayjs';

/**
 * Converts a Unix timestamp to milliseconds from now
 * @param timestamp Unix timestamp in seconds
 * @returns Milliseconds from now (can be negative if timestamp is in the past)
 */
export const millisecondsFromUnixTimestamp = (timestamp = 0) => {
  return (timestamp - dayjs().unix()) * 1000;
};
