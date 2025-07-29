import * as fs from 'node:fs/promises';
import * as path from 'node:path';

interface DeleteResult {
  success: boolean;
  path: string;
  error?: string;
}

async function deleteFiles(paths: string[]): Promise<DeleteResult[]> {
  const results: DeleteResult[] = [];

  // Process files sequentially to avoid race conditions
  for (const filePath of paths) {
    try {
      const resolvedPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(process.cwd(), filePath);

      // Check if file exists and get its stats
      let stats: Awaited<ReturnType<typeof fs.stat>>;
      try {
        stats = await fs.stat(resolvedPath);
      } catch (error) {
        let errorMessage = 'File not found';
        if (error instanceof Error && 'code' in error && error.code) {
          errorMessage =
            error.code === 'ENOENT' ? 'File not found' : `${error.code}: ${error.message}`;
        }
        results.push({
          success: false,
          path: filePath,
          error: errorMessage,
        });
        continue;
      }

      // Check if it's a directory
      if (stats.isDirectory()) {
        results.push({
          success: false,
          path: filePath,
          error: 'Cannot delete directories with this tool',
        });
        continue;
      }

      await fs.unlink(resolvedPath);

      results.push({
        success: true,
        path: filePath,
      });
    } catch (error) {
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
        // Preserve error code in message if available
        if ('code' in error && error.code) {
          errorMessage = `${error.code}: ${error.message}`;
        }
      }
      results.push({
        success: false,
        path: filePath,
        error: errorMessage,
      });
    }
  }

  return results;
}

// Script execution
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(JSON.stringify([]));
    process.exit(0);
  }

  let paths: string[];
  try {
    // First try to parse as JSON (from tool)
    const firstArg = args[0];
    if (!firstArg) {
      throw new Error('No argument provided');
    }
    paths = JSON.parse(firstArg);
    if (!Array.isArray(paths)) {
      throw new Error('Invalid input');
    }
  } catch {
    // Fall back to treating all arguments as paths (from integration tests)
    paths = args;
  }

  const results = await deleteFiles(paths);

  // Output as JSON to stdout
  console.log(JSON.stringify(results));
}

// Run the script
main().catch((error) => {
  console.log(
    JSON.stringify([
      {
        success: false,
        path: '',
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
    ])
  );
  process.exit(1);
});
