import * as child_process from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export interface LsOptions {
  detailed?: boolean;
  all?: boolean;
  recursive?: boolean;
  humanReadable?: boolean;
}

export interface LsEntry {
  name: string;
  type: 'file' | 'directory' | 'symlink' | 'other';
  size?: string;
  permissions?: string;
  modified?: string;
  owner?: string;
  group?: string;
}

export interface LsResult {
  success: boolean;
  path: string;
  entries?: LsEntry[];
  error?: string;
}

function buildLsCommand(targetPath: string, options?: LsOptions): string {
  const flags: string[] = [];

  if (options?.detailed) flags.push('-l');
  if (options?.all) flags.push('-a');
  if (options?.recursive) flags.push('-R');
  if (options?.humanReadable) flags.push('-h');

  const flagString = flags.length > 0 ? ` ${flags.join('')}` : '';
  return `ls${flagString} "${targetPath}"`;
}

function parseDetailedLsOutput(output: string): LsEntry[] {
  const lines = output
    .trim()
    .split('\n')
    .filter((line) => line.trim() !== '');
  const entries: LsEntry[] = [];

  for (const line of lines) {
    if (line.startsWith('total ') || line.trim() === '') continue;

    const parts = line.trim().split(/\s+/);
    if (parts.length < 9) continue;

    const permissions = parts[0];
    const owner = parts[2];
    const group = parts[3];
    const size = parts[4];
    const month = parts[5];
    const day = parts[6];
    const timeOrYear = parts[7];
    const name = parts.slice(8).join(' ');

    if (!permissions) continue;

    let type: LsEntry['type'] = 'file';
    if (permissions.startsWith('d')) type = 'directory';
    else if (permissions.startsWith('l')) type = 'symlink';
    else if (!permissions.startsWith('-')) type = 'other';

    const modified = `${month} ${day} ${timeOrYear}`;

    const entry: LsEntry = {
      name,
      type,
    };

    if (size) entry.size = size;
    if (permissions) entry.permissions = permissions;
    if (modified) entry.modified = modified;
    if (owner) entry.owner = owner;
    if (group) entry.group = group;

    entries.push(entry);
  }

  return entries;
}

function parseSimpleLsOutput(output: string): LsEntry[] {
  const lines = output
    .trim()
    .split('\n')
    .filter((line) => line.trim() !== '');
  return lines.map((name) => ({
    name: name.trim(),
    type: 'file' as const,
  }));
}

async function lsSinglePath(targetPath: string, options?: LsOptions): Promise<LsResult> {
  try {
    const resolvedPath = path.isAbsolute(targetPath)
      ? targetPath
      : path.join(process.cwd(), targetPath);

    try {
      await fs.access(resolvedPath);
    } catch {
      return {
        success: false,
        path: targetPath,
        error: 'Path not found',
      };
    }

    if (process.platform === 'win32') {
      return {
        success: false,
        path: targetPath,
        error: 'ls command not available on Windows platform',
      };
    }

    const command = buildLsCommand(resolvedPath, options);

    return new Promise((resolve) => {
      child_process.exec(command, (error, stdout, stderr) => {
        if (error) {
          resolve({
            success: false,
            path: targetPath,
            error: `Command failed: ${stderr || error.message}`,
          });
          return;
        }

        try {
          const entries = options?.detailed
            ? parseDetailedLsOutput(stdout)
            : parseSimpleLsOutput(stdout);

          resolve({
            success: true,
            path: targetPath,
            entries,
          });
        } catch (parseError) {
          resolve({
            success: false,
            path: targetPath,
            error: `Failed to parse ls output: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`,
          });
        }
      });
    });
  } catch (error) {
    return {
      success: false,
      path: targetPath,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function lsFilesSafely(paths: string[], options?: LsOptions): Promise<LsResult[]> {
  const lsPromises = paths.map((targetPath) => lsSinglePath(targetPath, options));
  return Promise.all(lsPromises);
}

export function generateLsCode(paths: string[], options?: LsOptions): string {
  return `
const child_process = require('child_process');
const path = require('path');
const fs = require('fs');

function buildLsCommand(targetPath: string, options?: any): string {
  const flags: string[] = [];
  
  if (options?.detailed) flags.push('-l');
  if (options?.all) flags.push('-a');
  if (options?.recursive) flags.push('-R');
  if (options?.humanReadable) flags.push('-h');
  
  const flagString = flags.length > 0 ? \` \${flags.join('')}\` : '';
  return \`ls\${flagString} "\${targetPath}"\`;
}

function parseDetailedLsOutput(output: string) {
  const lines = output.trim().split('\\n').filter((line: string) => line.trim() !== '');
  const entries: any[] = [];
  
  for (const line of lines) {
    if (line.startsWith('total ') || line.trim() === '') continue;
    
    const parts = line.trim().split(/\\s+/);
    if (parts.length < 9) continue;
    
    const permissions = parts[0];
    const owner = parts[2];
    const group = parts[3];
    const size = parts[4];
    const month = parts[5];
    const day = parts[6];
    const timeOrYear = parts[7];
    const name = parts.slice(8).join(' ');
    
    let type = 'file';
    if (permissions.startsWith('d')) type = 'directory';
    else if (permissions.startsWith('l')) type = 'symlink';
    else if (!permissions.startsWith('-')) type = 'other';
    
    const modified = \`\${month} \${day} \${timeOrYear}\`;
    
    entries.push({
      name,
      type,
      size,
      permissions,
      modified,
      owner,
      group,
    });
  }
  
  return entries;
}

function parseSimpleLsOutput(output: string) {
  const lines = output.trim().split('\\n').filter((line: string) => line.trim() !== '');
  return lines.map((name: string) => ({
    name: name.trim(),
    type: 'file',
  }));
}

function lsSinglePath(targetPath: string, options?: any) {
  try {
    const resolvedPath = path.isAbsolute(targetPath) ? targetPath : path.join(process.cwd(), targetPath);
    
    try {
      fs.accessSync(resolvedPath);
    } catch {
      return {
        success: false,
        path: targetPath,
        error: 'Path not found',
      };
    }
    
    if (process.platform === 'win32') {
      return {
        success: false,
        path: targetPath,
        error: 'ls command not available on Windows platform',
      };
    }
    
    const command = buildLsCommand(resolvedPath, options);
    
    try {
      const stdout = child_process.execSync(command, { encoding: 'utf8' });
      
      const entries = options?.detailed 
        ? parseDetailedLsOutput(stdout)
        : parseSimpleLsOutput(stdout);
      
      return {
        success: true,
        path: targetPath,
        entries,
      };
    } catch (error: any) {
      return {
        success: false,
        path: targetPath,
        error: \`Command failed: \${error.message}\`,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      path: targetPath,
      error: error.message || 'Unknown error occurred',
    };
  }
}

function lsFilesConcurrently(paths: string[], options?: any) {
  return paths.map((targetPath: string) => lsSinglePath(targetPath, options));
}

const paths = ${JSON.stringify(paths)};
const options = ${JSON.stringify(options || {})};
const results = lsFilesConcurrently(paths, options);
console.log(JSON.stringify(results));
  `.trim();
}
