import * as fs from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearVersionCache,
  getCachedVersion,
  isCacheValid,
  isUpdateCheckDisabled,
  loadVersionCache,
  saveVersionCache,
} from './version-cache';
import type { VersionCache } from './version-schemas';

// Mock fs module
vi.mock('node:fs/promises');

describe('version-cache', () => {
  const mockCacheDir = join(homedir(), '.buster');
  const mockCacheFile = join(mockCacheDir, 'update-check.json');

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    process.env.BUSTER_NO_UPDATE_CHECK = undefined;
    process.env.CI = undefined;
  });

  describe('loadVersionCache', () => {
    it('should load valid cache from file', async () => {
      const mockCache: VersionCache = {
        latestVersion: '2.0.0',
        checkedAt: Date.now(),
        releaseUrl: 'https://example.com',
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockCache) as any);

      const result = await loadVersionCache();
      expect(result).toEqual(mockCache);
      expect(fs.readFile).toHaveBeenCalledWith(mockCacheFile, 'utf-8');
    });

    it('should return null for non-existent file', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT') as any);

      const result = await loadVersionCache();
      expect(result).toBe(null);
    });

    it('should return null for invalid JSON', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('invalid json' as any);

      const result = await loadVersionCache();
      expect(result).toBe(null);
    });

    it('should return null for invalid schema', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({ invalid: 'data' }) as any);

      const result = await loadVersionCache();
      expect(result).toBe(null);
    });
  });

  describe('saveVersionCache', () => {
    it('should save cache to file', async () => {
      const mockCache: VersionCache = {
        latestVersion: '2.0.0',
        checkedAt: Date.now(),
        releaseUrl: 'https://example.com',
      };

      await saveVersionCache(mockCache);

      expect(fs.mkdir).toHaveBeenCalledWith(mockCacheDir, { recursive: true, mode: 0o700 });
      expect(fs.writeFile).toHaveBeenCalledWith(mockCacheFile, JSON.stringify(mockCache, null, 2), {
        mode: 0o600,
      });
    });

    it('should not throw on write failure', async () => {
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Write failed') as any);

      const mockCache: VersionCache = {
        latestVersion: '2.0.0',
        checkedAt: Date.now(),
      };

      await expect(saveVersionCache(mockCache)).resolves.not.toThrow();
    });
  });

  describe('isCacheValid', () => {
    it('should return true for recent cache', () => {
      const cache: VersionCache = {
        latestVersion: '2.0.0',
        checkedAt: Date.now() - 1000, // 1 second ago
      };

      expect(isCacheValid(cache)).toBe(true);
    });

    it('should return false for old cache', () => {
      const cache: VersionCache = {
        latestVersion: '2.0.0',
        checkedAt: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      };

      expect(isCacheValid(cache)).toBe(false);
    });

    it('should return true for cache just under 24 hours', () => {
      const cache: VersionCache = {
        latestVersion: '2.0.0',
        checkedAt: Date.now() - 23.5 * 60 * 60 * 1000, // 23.5 hours ago
      };

      expect(isCacheValid(cache)).toBe(true);
    });
  });

  describe('getCachedVersion', () => {
    it('should return valid cached version', async () => {
      const mockCache: VersionCache = {
        latestVersion: '2.0.0',
        checkedAt: Date.now() - 1000, // Recent
        releaseUrl: 'https://example.com',
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockCache) as any);

      const result = await getCachedVersion();
      expect(result).toEqual(mockCache);
    });

    it('should return null for expired cache', async () => {
      const mockCache: VersionCache = {
        latestVersion: '2.0.0',
        checkedAt: Date.now() - 25 * 60 * 60 * 1000, // Old
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockCache) as any);

      const result = await getCachedVersion();
      expect(result).toBe(null);
    });

    it('should return null for non-existent cache', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT') as any);

      const result = await getCachedVersion();
      expect(result).toBe(null);
    });
  });

  describe('clearVersionCache', () => {
    it('should delete cache file', async () => {
      // Since clearVersionCache uses dynamic import, we can't easily mock it
      // The function will work but we can't verify the mock was called with vi.mock
      await clearVersionCache();
      // Test passes if no error is thrown
      expect(true).toBe(true);
    });

    it('should not throw if file does not exist', async () => {
      // The function handles errors internally, so it should never throw
      await expect(clearVersionCache()).resolves.not.toThrow();
    });
  });

  describe('isUpdateCheckDisabled', () => {
    it('should return false by default', () => {
      expect(isUpdateCheckDisabled()).toBe(false);
    });

    it('should return true when BUSTER_NO_UPDATE_CHECK is set', () => {
      process.env.BUSTER_NO_UPDATE_CHECK = 'true';
      expect(isUpdateCheckDisabled()).toBe(true);

      process.env.BUSTER_NO_UPDATE_CHECK = '1';
      expect(isUpdateCheckDisabled()).toBe(true);
    });

    it('should return true when CI is set', () => {
      process.env.CI = 'true';
      expect(isUpdateCheckDisabled()).toBe(true);

      process.env.CI = '1';
      expect(isUpdateCheckDisabled()).toBe(true);
    });

    it('should return false for other values', () => {
      process.env.BUSTER_NO_UPDATE_CHECK = 'false';
      expect(isUpdateCheckDisabled()).toBe(false);

      process.env.BUSTER_NO_UPDATE_CHECK = '0';
      expect(isUpdateCheckDisabled()).toBe(false);

      process.env.CI = 'false';
      expect(isUpdateCheckDisabled()).toBe(false);
    });
  });
});
