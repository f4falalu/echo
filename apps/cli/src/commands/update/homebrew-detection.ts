import { execSync } from 'node:child_process';
import { existsSync, readlinkSync } from 'node:fs';
import { platform } from 'node:os';
import chalk from 'chalk';

/**
 * Check if the CLI was installed via Homebrew
 */
export function isInstalledViaHomebrew(): boolean {
  try {
    // Only check on macOS and Linux
    if (platform() !== 'darwin' && platform() !== 'linux') {
      return false;
    }

    // Get the path of the current executable
    const execPath = process.execPath;

    // Check if it's a symlink (Homebrew creates symlinks)
    if (!existsSync(execPath)) {
      return false;
    }

    // Try to resolve the symlink
    let realPath = execPath;
    try {
      realPath = readlinkSync(execPath);
    } catch {
      // Not a symlink, use original path
    }

    // Check if the path contains Homebrew directories
    const homebrewPaths = [
      '/opt/homebrew', // Apple Silicon Macs
      '/usr/local/Cellar', // Intel Macs
      '/home/linuxbrew', // Linux
      '/.linuxbrew', // Linux alternative
    ];

    const isHomebrewPath = homebrewPaths.some(
      (path) => realPath.includes(path) || execPath.includes(path)
    );

    if (isHomebrewPath) {
      return true;
    }

    // Alternative check: see if buster formula is installed
    try {
      const result = execSync('brew list buster 2>/dev/null', {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      return result.length > 0;
    } catch {
      // brew command failed or buster not installed via brew
      return false;
    }
  } catch {
    // Any error means we can't determine, assume not Homebrew
    return false;
  }
}

/**
 * Get Homebrew installation instructions
 */
export function getHomebrewUpdateInstructions(): string {
  return `To update Buster via Homebrew, run:

  ${chalk.cyan('brew update')}
  ${chalk.cyan('brew upgrade buster')}

Or to reinstall:
  ${chalk.cyan('brew reinstall buster')}`;
}

/**
 * Get direct binary update instructions
 */
export function getDirectUpdateInstructions(): string {
  return `To update Buster, run:

  ${chalk.cyan('buster update')}

This will download and install the latest version.`;
}
