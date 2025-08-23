import * as child_process from 'node:child_process';
import * as path from 'node:path';

interface TreeOptions {
  gitignore?: boolean;
  maxDepth?: number;
  dirsOnly?: boolean;
  pattern?: string;
}

interface TreeResult {
  success: boolean;
  output?: string;
  error?: string;
  command?: string;
}

function buildTreeCommand(targetPath: string, options?: TreeOptions): string {
  const flags: string[] = [];

  // Add --gitignore flag if requested
  if (options?.gitignore) {
    flags.push('--gitignore');
  }

  // Add max depth if specified
  if (options?.maxDepth !== undefined) {
    flags.push('-L', options.maxDepth.toString());
  }

  // Add dirs only flag if requested
  if (options?.dirsOnly) {
    flags.push('-d');
  }

  // Add pattern if specified
  if (options?.pattern) {
    flags.push('-P', `"${options.pattern}"`);
  }

  const flagString = flags.length > 0 ? ` ${flags.join(' ')}` : '';
  return `tree${flagString} "${targetPath}"`;
}

async function executeTreeCommand(targetPath: string, options?: TreeOptions): Promise<TreeResult> {
  return new Promise((resolve) => {
    const resolvedPath = path.isAbsolute(targetPath)
      ? targetPath
      : path.join(process.cwd(), targetPath);

    // Use resolvedPath for execution but targetPath for command display
    const executionCommand = buildTreeCommand(resolvedPath, options);
    const displayCommand = buildTreeCommand(targetPath, options);

    child_process.exec(
      executionCommand,
      { maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          // Check if tree command exists
          if (
            error.message.includes('command not found') ||
            error.message.includes('is not recognized')
          ) {
            resolve({
              success: false,
              error: 'tree command not installed. Please install tree to use this functionality.',
              command: displayCommand,
            });
            return;
          }

          resolve({
            success: false,
            error: stderr || error.message,
            command: displayCommand,
          });
          return;
        }

        resolve({
          success: true,
          output: stdout,
          command: displayCommand,
        });
      }
    );
  });
}

// Script execution
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(
      JSON.stringify({
        success: false,
        error: 'No arguments provided. Expected JSON string as argument.',
      })
    );
    process.exit(1);
  }

  try {
    // Decode base64 argument and parse JSON
    const firstArg = args[0];
    if (!firstArg) {
      throw new Error('No argument provided');
    }
    const decoded = Buffer.from(firstArg, 'base64').toString('utf-8');
    const { path: targetPath = '.', options = {} } = JSON.parse(decoded) as {
      path?: string;
      options?: TreeOptions;
    };

    // Execute tree command
    const result = await executeTreeCommand(targetPath, options);

    // Output as JSON to stdout
    console.log(JSON.stringify(result));
  } catch (error) {
    // Output error as JSON to stdout (not stderr) so it can be parsed
    console.log(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      })
    );
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.log(
    JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred',
    })
  );
  process.exit(1);
});
