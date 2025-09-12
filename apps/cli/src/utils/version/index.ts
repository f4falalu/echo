// Main exports for version utilities

export {
  clearVersionCache,
  getCachedVersion,
  isCacheValid,
  isUpdateCheckDisabled,
  loadVersionCache,
  saveVersionCache,
} from './version-cache';
export {
  checkForUpdate,
  checkForUpdateInBackground,
  fetchLatestRelease,
  getLatestVersion,
} from './version-check';
export {
  createUpdateCheckResult,
  formatVersion,
  isUpdateAvailable,
  parseVersion,
} from './version-compare';

// Export types
export type {
  DownloadInfo,
  GitHubRelease,
  PlatformInfo,
  UpdateCheckResult,
  VersionCache,
} from './version-schemas';
