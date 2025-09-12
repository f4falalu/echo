import { describe, expect, it } from 'vitest';
import {
  createUpdateCheckResult,
  formatVersion,
  isUpdateAvailable,
  parseVersion,
} from './version-compare.js';

describe('version-compare', () => {
  describe('isUpdateAvailable', () => {
    it('should detect major version updates', () => {
      expect(isUpdateAvailable('1.0.0', '2.0.0')).toBe(true);
      expect(isUpdateAvailable('0.1.0', '1.0.0')).toBe(true);
    });

    it('should detect minor version updates', () => {
      expect(isUpdateAvailable('1.0.0', '1.1.0')).toBe(true);
      expect(isUpdateAvailable('2.3.0', '2.4.0')).toBe(true);
    });

    it('should detect patch version updates', () => {
      expect(isUpdateAvailable('1.0.0', '1.0.1')).toBe(true);
      expect(isUpdateAvailable('2.3.4', '2.3.5')).toBe(true);
    });

    it('should return false for same version', () => {
      expect(isUpdateAvailable('1.0.0', '1.0.0')).toBe(false);
      expect(isUpdateAvailable('2.3.4', '2.3.4')).toBe(false);
    });

    it('should return false for older versions', () => {
      expect(isUpdateAvailable('2.0.0', '1.0.0')).toBe(false);
      expect(isUpdateAvailable('1.1.0', '1.0.0')).toBe(false);
      expect(isUpdateAvailable('1.0.1', '1.0.0')).toBe(false);
    });

    it('should handle versions with v prefix', () => {
      expect(isUpdateAvailable('v1.0.0', 'v2.0.0')).toBe(true);
      expect(isUpdateAvailable('v1.0.0', 'v1.0.0')).toBe(false);
      expect(isUpdateAvailable('v2.0.0', 'v1.0.0')).toBe(false);
    });

    it('should handle pre-release versions', () => {
      expect(isUpdateAvailable('1.0.0-alpha', '1.0.0')).toBe(true);
      expect(isUpdateAvailable('1.0.0-beta', '1.0.0')).toBe(true);
      expect(isUpdateAvailable('1.0.0', '1.0.0-beta')).toBe(false);
    });

    it('should return false for invalid versions', () => {
      expect(isUpdateAvailable('invalid', '1.0.0')).toBe(false);
      expect(isUpdateAvailable('1.0.0', 'invalid')).toBe(false);
      expect(isUpdateAvailable('invalid', 'invalid')).toBe(false);
    });
  });

  describe('createUpdateCheckResult', () => {
    it('should create result with update available', () => {
      const result = createUpdateCheckResult('1.0.0', '2.0.0', 'https://example.com');

      expect(result).toEqual({
        updateAvailable: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        releaseUrl: 'https://example.com',
      });
    });

    it('should create result with no update available', () => {
      const result = createUpdateCheckResult('2.0.0', '2.0.0');

      expect(result).toEqual({
        updateAvailable: false,
        currentVersion: '2.0.0',
        latestVersion: '2.0.0',
        releaseUrl: undefined,
      });
    });

    it('should clean version strings', () => {
      const result = createUpdateCheckResult('v1.0.0', 'v2.0.0');

      expect(result.currentVersion).toBe('1.0.0');
      expect(result.latestVersion).toBe('2.0.0');
    });
  });

  describe('formatVersion', () => {
    it('should add v prefix if not present', () => {
      expect(formatVersion('1.0.0')).toBe('v1.0.0');
      expect(formatVersion('2.3.4')).toBe('v2.3.4');
    });

    it('should keep v prefix if already present', () => {
      expect(formatVersion('v1.0.0')).toBe('v1.0.0');
      expect(formatVersion('v2.3.4')).toBe('v2.3.4');
    });

    it('should return original for invalid versions', () => {
      expect(formatVersion('invalid')).toBe('invalid');
      expect(formatVersion('')).toBe('');
    });
  });

  describe('parseVersion', () => {
    it('should parse valid versions', () => {
      expect(parseVersion('1.0.0')).toBe('1.0.0');
      expect(parseVersion('2.3.4')).toBe('2.3.4');
    });

    it('should remove v prefix', () => {
      expect(parseVersion('v1.0.0')).toBe('1.0.0');
      expect(parseVersion('v2.3.4')).toBe('2.3.4');
    });

    it('should handle pre-release versions', () => {
      expect(parseVersion('1.0.0-alpha')).toBe('1.0.0-alpha');
      expect(parseVersion('v1.0.0-beta.1')).toBe('1.0.0-beta.1');
    });

    it('should return null for invalid versions', () => {
      expect(parseVersion('invalid')).toBe(null);
      expect(parseVersion('')).toBe(null);
      expect(parseVersion('not.a.version')).toBe(null);
    });
  });
});
