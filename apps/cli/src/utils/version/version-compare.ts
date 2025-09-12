import semver from 'semver';
import type { UpdateCheckResult } from './version-schemas';

/**
 * Compare two semantic versions and determine if an update is available
 * @param currentVersion Current version (without 'v' prefix)
 * @param latestVersion Latest version (without 'v' prefix)
 * @returns true if latest version is newer than current version
 */
export function isUpdateAvailable(currentVersion: string, latestVersion: string): boolean {
  try {
    // Clean versions (remove 'v' prefix if present)
    const current = semver.clean(currentVersion);
    const latest = semver.clean(latestVersion);

    if (!current || !latest) {
      return false;
    }

    // Compare versions - returns true if latest > current
    return semver.gt(latest, current);
  } catch {
    // If version parsing fails, assume no update
    return false;
  }
}

/**
 * Create an update check result
 */
export function createUpdateCheckResult(
  currentVersion: string,
  latestVersion: string,
  releaseUrl?: string
): UpdateCheckResult {
  const updateAvailable = isUpdateAvailable(currentVersion, latestVersion);

  return {
    updateAvailable,
    currentVersion: semver.clean(currentVersion) || currentVersion,
    latestVersion: semver.clean(latestVersion) || latestVersion,
    releaseUrl,
  };
}

/**
 * Format version for display (adds 'v' prefix if not present)
 */
export function formatVersion(version: string): string {
  const cleaned = semver.clean(version);
  if (!cleaned) return version;
  return version.startsWith('v') ? version : `v${cleaned}`;
}

/**
 * Parse version from various formats (v1.2.3, 1.2.3, etc.)
 */
export function parseVersion(version: string): string | null {
  return semver.clean(version);
}
