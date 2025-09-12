import { z } from 'zod';

// GitHub API response schema
export const GitHubReleaseSchema = z.object({
  tag_name: z.string(),
  name: z.string().optional(),
  published_at: z.string(),
  html_url: z.string().url(),
  assets: z
    .array(
      z.object({
        name: z.string(),
        browser_download_url: z.string().url(),
        size: z.number(),
      })
    )
    .optional(),
});

export type GitHubRelease = z.infer<typeof GitHubReleaseSchema>;

// Version cache schema
export const VersionCacheSchema = z.object({
  latestVersion: z.string(),
  checkedAt: z.number(), // Unix timestamp
  releaseUrl: z.string().url().optional(),
});

export type VersionCache = z.infer<typeof VersionCacheSchema>;

// Update check result schema
export const UpdateCheckResultSchema = z.object({
  updateAvailable: z.boolean(),
  currentVersion: z.string(),
  latestVersion: z.string(),
  releaseUrl: z.string().url().optional(),
});

export type UpdateCheckResult = z.infer<typeof UpdateCheckResultSchema>;

// Platform info schema
export const PlatformInfoSchema = z.object({
  os: z.enum(['darwin', 'linux', 'win32']),
  arch: z.enum(['x64', 'arm64']),
  isHomebrew: z.boolean(),
});

export type PlatformInfo = z.infer<typeof PlatformInfoSchema>;

// Download info schema
export const DownloadInfoSchema = z.object({
  url: z.string().url(),
  checksumUrl: z.string().url(),
  fileName: z.string(),
  platform: PlatformInfoSchema,
});

export type DownloadInfo = z.infer<typeof DownloadInfoSchema>;
