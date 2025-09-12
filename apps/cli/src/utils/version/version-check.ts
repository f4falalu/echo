import { getCachedVersion, isUpdateCheckDisabled, saveVersionCache } from './version-cache';
import { createUpdateCheckResult } from './version-compare';
import { type GitHubRelease, GitHubReleaseSchema, type UpdateCheckResult } from './version-schemas';

const GITHUB_API_URL = 'https://api.github.com/repos/buster-so/buster/releases/latest';
const USER_AGENT = 'buster-cli';

/**
 * Fetch the latest release information from GitHub
 */
export async function fetchLatestRelease(): Promise<GitHubRelease | null> {
  try {
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(GITHUB_API_URL, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/vnd.github.v3+json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Silently fail - don't disrupt user experience
      return null;
    }

    const data = await response.json();
    const parsed = GitHubReleaseSchema.safeParse(data);

    if (!parsed.success) {
      return null;
    }

    return parsed.data;
  } catch {
    // Network error or other issue - silently fail
    return null;
  }
}

/**
 * Get the latest version from GitHub (with caching)
 */
export async function getLatestVersion(): Promise<string | null> {
  // Check if updates are disabled
  if (isUpdateCheckDisabled()) {
    return null;
  }

  // Try to get from cache first
  const cached = await getCachedVersion();
  if (cached) {
    return cached.latestVersion;
  }

  // Fetch from GitHub
  const release = await fetchLatestRelease();
  if (!release) {
    return null;
  }

  // Extract version from tag name (remove 'v' prefix if present)
  const version = release.tag_name.replace(/^v/, '');

  // Cache the result
  await saveVersionCache({
    latestVersion: version,
    checkedAt: Date.now(),
    releaseUrl: release.html_url,
  });

  return version;
}

/**
 * Check for updates
 */
export async function checkForUpdate(currentVersion: string): Promise<UpdateCheckResult | null> {
  const latestVersion = await getLatestVersion();

  if (!latestVersion) {
    return null;
  }

  // Get cached data for release URL
  const cached = await getCachedVersion();

  return createUpdateCheckResult(currentVersion, latestVersion, cached?.releaseUrl);
}

/**
 * Check for updates in the background (non-blocking)
 */
export function checkForUpdateInBackground(currentVersion: string): void {
  // Run check asynchronously without awaiting
  checkForUpdate(currentVersion).catch(() => {
    // Silently ignore errors in background check
  });
}
