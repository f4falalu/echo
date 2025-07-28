import * as child_process from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

interface GrepOptions {
  recursive?: boolean;
  ignoreCase?: boolean;
  invertMatch?: boolean;
  lineNumbers?: boolean;
  wordMatch?: boolean;
  fixedStrings?: boolean;
  maxCount?: number;
}

type SearchInput = {
  path: string;
  pattern: string;
  recursive?: boolean;
  ignoreCase?: boolean;
  invertMatch?: boolean;
  lineNumbers?: boolean;
  wordMatch?: boolean;
  fixedStrings?: boolean;
  maxCount?: number;
};

interface GrepMatch {
  file: string;
  lineNumber?: number;
  content: string;
}

interface GrepResult {
  success: boolean;
  path: string;
  pattern: string;
  matches?: GrepMatch[];
  matchCount?: number;
  error?: string;
}

function buildGrepCommand(targetPath: string, pattern: string, options?: GrepOptions): string {
  const args: string[] = [];

  if (options?.recursive) args.push('-r');
  if (options?.ignoreCase) args.push('-i');
  if (options?.invertMatch) args.push('-v');
  if (options?.lineNumbers ?? true) args.push('-n');
  if (options?.wordMatch) args.push('-w');
  if (options?.fixedStrings) args.push('-F');
  if (options?.maxCount) {
    args.push('-m');
    args.push(options.maxCount.toString());
  }

  // Build the grep command with proper escaping
  const escapedPattern = pattern.replace(/"/g, '\\"');
  const escapedPath = targetPath.replace(/"/g, '\\"');

  return `grep ${args.join(' ')} "${escapedPattern}" "${escapedPath}"`;
}

function parseGrepOutput(output: string, path: string, options?: GrepOptions): GrepMatch[] {
  const lines = output
    .trim()
    .split('\n')
    .filter((line) => line.length > 0);

  const matches: GrepMatch[] = [];
  const showLineNumbers = options?.lineNumbers ?? true;

  for (const line of lines) {
    if (showLineNumbers) {
      if (options?.recursive) {
        // Recursive format: filename:linenumber:content
        const match = line.match(/^([^:]+):(\d+):(.*)$/);
        if (match?.[1] && match[2] && match[3] !== undefined) {
          matches.push({
            file: match[1],
            lineNumber: Number.parseInt(match[2], 10),
            content: match[3],
          });
        } else {
          matches.push({
            file: path,
            content: line,
          });
        }
      } else {
        // Single file format: linenumber:content
        const match = line.match(/^(\d+):(.*)$/);
        if (match?.[1] && match[2] !== undefined) {
          matches.push({
            file: path,
            lineNumber: Number.parseInt(match[1], 10),
            content: match[2],
          });
        } else {
          matches.push({
            file: path,
            content: line,
          });
        }
      }
    } else {
      // Without line numbers
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0 && options?.recursive) {
        matches.push({
          file: line.substring(0, colonIndex),
          content: line.substring(colonIndex + 1),
        });
      } else {
        matches.push({
          file: path,
          content: line,
        });
      }
    }
  }

  return matches;
}

async function grepSingleSearch(
  targetPath: string,
  pattern: string,
  options?: GrepOptions
): Promise<GrepResult> {
  try {
    // Check if path exists
    const resolvedPath = path.isAbsolute(targetPath)
      ? targetPath
      : path.join(process.cwd(), targetPath);

    try {
      await fs.access(resolvedPath);
    } catch {
      return {
        success: false,
        path: targetPath,
        pattern,
        error: `Path does not exist: ${targetPath}`,
      };
    }

    if (process.platform === 'win32') {
      return {
        success: false,
        path: targetPath,
        pattern,
        error: 'grep command not available on Windows platform',
      };
    }

    const command = buildGrepCommand(resolvedPath, pattern, options);

    return new Promise((resolve) => {
      child_process.exec(
        command,
        {
          encoding: 'utf8',
          maxBuffer: 1024 * 1024 * 10, // 10MB buffer
          timeout: 30000, // 30 second timeout
        },
        (error, stdout, stderr) => {
          if (error) {
            // Exit code 1 means no matches found, which is not an error
            if (error.code === 1) {
              resolve({
                success: true,
                path: targetPath,
                pattern,
                matches: [],
                matchCount: 0,
              });
              return;
            }

            resolve({
              success: false,
              path: targetPath,
              pattern,
              error: `Command failed: ${stderr || error.message}`,
            });
            return;
          }

          try {
            const matches = parseGrepOutput(stdout, targetPath, options);

            resolve({
              success: true,
              path: targetPath,
              pattern,
              matches,
              matchCount: matches.length,
            });
          } catch (parseError) {
            resolve({
              success: false,
              path: targetPath,
              pattern,
              error: `Failed to parse grep output: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`,
            });
          }
        }
      );
    });
  } catch (error) {
    return {
      success: false,
      path: targetPath,
      pattern,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

async function grepSearchesSafely(searches: SearchInput[]): Promise<GrepResult[]> {
  const grepPromises = searches.map((search) =>
    grepSingleSearch(search.path, search.pattern, search)
  );
  return Promise.all(grepPromises);
}

// Script execution
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);

  // Extract searches from args
  // Expected format: JSON array of search objects
  if (args.length === 0) {
    console.log(JSON.stringify([]));
    return;
  }

  try {
    const searches = JSON.parse(args[0] || '[]');

    if (!Array.isArray(searches)) {
      console.log(
        JSON.stringify([
          {
            success: false,
            path: 'unknown',
            pattern: 'unknown',
            error: 'Invalid input: expected array of searches',
          },
        ])
      );
      return;
    }

    const results = await grepSearchesSafely(searches);

    // Output as JSON to stdout
    console.log(JSON.stringify(results));
  } catch (error) {
    console.log(
      JSON.stringify([
        {
          success: false,
          path: 'unknown',
          pattern: 'unknown',
          error: `Failed to parse input: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ])
    );
  }
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
