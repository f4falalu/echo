import * as child_process from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

interface LsOptions {
  detailed?: boolean;
  all?: boolean;
  recursive?: boolean;
  humanReadable?: boolean;
}

interface LsEntry {
  name: string;
  type: 'file' | 'directory' | 'symlink' | 'other';
  size?: string;
  permissions?: string;
  modified?: string;
  owner?: string;
  group?: string;
}

interface LsResult {
  success: boolean;
  path: string;
  entries?: LsEntry[];
  error?: string;
}

function buildLsCommand(targetPath: string, options?: LsOptions): string {
  const flags: string[] = [];

  if (options?.detailed) flags.push('l');
  if (options?.all) flags.push('a');
  if (options?.recursive) flags.push('R');
  if (options?.humanReadable) flags.push('h');

  // Always add -F to get file type indicators unless using detailed mode
  if (!options?.detailed) flags.push('F');

  const flagString = flags.length > 0 ? ` -${flags.join('')}` : '';
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

  return lines.map((line) => {
    const trimmedLine = line.trim();
    let name = trimmedLine;
    let type: LsEntry['type'] = 'file';

    // Check for file type indicators from -F flag
    if (trimmedLine.endsWith('/')) {
      name = trimmedLine.slice(0, -1);
      type = 'directory';
    } else if (trimmedLine.endsWith('@')) {
      name = trimmedLine.slice(0, -1);
      type = 'symlink';
    } else if (trimmedLine.endsWith('*')) {
      name = trimmedLine.slice(0, -1);
      type = 'file'; // executable file
    } else if (trimmedLine.endsWith('|')) {
      name = trimmedLine.slice(0, -1);
      type = 'other'; // FIFO
    } else if (trimmedLine.endsWith('=')) {
      name = trimmedLine.slice(0, -1);
      type = 'other'; // socket
    }

    return { name, type };
  });
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

async function lsFilesSafely(paths: string[], options?: LsOptions): Promise<LsResult[]> {
  const lsPromises = paths.map((targetPath) => lsSinglePath(targetPath, options));
  return Promise.all(lsPromises);
}

// Script execution
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);

  // Extract options from args
  const options: LsOptions = {};
  const paths: string[] = [];

  for (const arg of args) {
    if (arg.startsWith('-')) {
      if (arg.includes('l')) options.detailed = true;
      if (arg.includes('a')) options.all = true;
      if (arg.includes('R')) options.recursive = true;
      if (arg.includes('h')) options.humanReadable = true;
    } else {
      paths.push(arg);
    }
  }

  // Default to current directory if no paths provided
  if (paths.length === 0) {
    paths.push('.');
  }

  const results = await lsFilesSafely(paths, options);

  // Output as JSON to stdout
  console.log(JSON.stringify(results));
}

// Run the script
main().catch((error) => {
  console.error(
    JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred',
    })
  );
  process.exit(1);
});
