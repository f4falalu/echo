import { execSync } from 'node:child_process';
import { existsSync, readlinkSync } from 'node:fs';
import { platform } from 'node:os';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getDirectUpdateInstructions,
  getHomebrewUpdateInstructions,
  isInstalledViaHomebrew,
} from './homebrew-detection';

// Mock modules
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readlinkSync: vi.fn(),
}));

vi.mock('node:os', () => ({
  platform: vi.fn(),
}));

describe('homebrew-detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset process.execPath
    Object.defineProperty(process, 'execPath', {
      value: '/usr/local/bin/buster',
      writable: true,
    });
  });

  describe('isInstalledViaHomebrew', () => {
    it('should return false on Windows', () => {
      vi.mocked(platform).mockReturnValue('win32');

      expect(isInstalledViaHomebrew()).toBe(false);
    });

    it('should detect Homebrew installation on Apple Silicon Mac', () => {
      vi.mocked(platform).mockReturnValue('darwin');
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readlinkSync).mockReturnValue('/opt/homebrew/Cellar/buster/0.3.1/bin/buster');

      expect(isInstalledViaHomebrew()).toBe(true);
    });

    it('should detect Homebrew installation on Intel Mac', () => {
      vi.mocked(platform).mockReturnValue('darwin');
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readlinkSync).mockReturnValue('/usr/local/Cellar/buster/0.3.1/bin/buster');

      expect(isInstalledViaHomebrew()).toBe(true);
    });

    it('should detect Homebrew installation on Linux', () => {
      vi.mocked(platform).mockReturnValue('linux');
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readlinkSync).mockReturnValue(
        '/home/linuxbrew/.linuxbrew/Cellar/buster/0.3.1/bin/buster'
      );

      expect(isInstalledViaHomebrew()).toBe(true);
    });

    it('should detect via brew list command', () => {
      vi.mocked(platform).mockReturnValue('darwin');
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readlinkSync).mockReturnValue('/usr/local/bin/buster');
      vi.mocked(execSync).mockReturnValue('buster 0.3.1\n');

      expect(isInstalledViaHomebrew()).toBe(true);
      expect(execSync).toHaveBeenCalledWith('brew list buster 2>/dev/null', expect.any(Object));
    });

    it('should return false if brew command fails', () => {
      vi.mocked(platform).mockReturnValue('darwin');
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readlinkSync).mockReturnValue('/usr/local/bin/buster');
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Command failed');
      });

      expect(isInstalledViaHomebrew()).toBe(false);
    });

    it('should return false for non-Homebrew path', () => {
      vi.mocked(platform).mockReturnValue('darwin');
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readlinkSync).mockReturnValue('/custom/path/buster');
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Command failed');
      });

      expect(isInstalledViaHomebrew()).toBe(false);
    });

    it('should handle non-symlink executables', () => {
      vi.mocked(platform).mockReturnValue('darwin');
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readlinkSync).mockImplementation(() => {
        throw new Error('Not a symlink');
      });
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Command failed');
      });

      Object.defineProperty(process, 'execPath', {
        value: '/usr/local/bin/buster',
        writable: true,
      });

      expect(isInstalledViaHomebrew()).toBe(false);
    });

    it('should return false if executable does not exist', () => {
      vi.mocked(platform).mockReturnValue('darwin');
      vi.mocked(existsSync).mockReturnValue(false);

      expect(isInstalledViaHomebrew()).toBe(false);
    });
  });

  describe('getHomebrewUpdateInstructions', () => {
    it('should return Homebrew update instructions', () => {
      const instructions = getHomebrewUpdateInstructions();

      expect(instructions).toContain('brew update');
      expect(instructions).toContain('brew upgrade buster');
      expect(instructions).toContain('brew reinstall buster');
    });
  });

  describe('getDirectUpdateInstructions', () => {
    it('should return direct update instructions', () => {
      const instructions = getDirectUpdateInstructions();

      expect(instructions).toContain('buster update');
      expect(instructions).toContain('download and install the latest version');
    });
  });
});
