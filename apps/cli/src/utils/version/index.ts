// Main exports for version utilities

export {
  clearVersionCache,
  getCachedVersion,
  isCacheValid,
  isUpdateCheckDisabled,
  loadVersionCache,
  saveVersionCache,
} from './version-cache.js';
export {
  checkForUpdate,
  checkForUpdateInBackground,
  fetchLatestRelease,
  getLatestVersion,
} from './version-check.js';
export {
  createUpdateCheckResult,
  formatVersion,
  isUpdateAvailable,
  parseVersion,
} from './version-compare.js';

// Export types
export type {
  DownloadInfo,
  GitHubRelease,
  PlatformInfo,
  UpdateCheckResult,
  VersionCache,
} from './version-schemas.js';
