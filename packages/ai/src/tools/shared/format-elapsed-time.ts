/**
 * Format elapsed time for display in secondary_title
 * @param startTime - The start time in milliseconds (from Date.now())
 * @param endTime - The end time in milliseconds (from Date.now()), defaults to current time
 * @returns Formatted string like "4.9 seconds" or "2 minutes"
 */
export function formatElapsedTime(startTime?: number, endTime?: number): string | undefined {
  if (!startTime) {
    return undefined;
  }

  const end = endTime ?? Date.now();
  const elapsedMs = end - startTime;
  const elapsedSeconds = elapsedMs / 1000;

  if (elapsedSeconds < 60) {
    // For seconds, show one decimal place
    return `${elapsedSeconds.toFixed(1)} seconds`;
  }

  // For minutes, show whole minutes only
  const minutes = Math.floor(elapsedSeconds / 60);
  return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
}
