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

      try {
        await fs.access(resolvedPath);
      } catch {
        results.push({
          success: false,
          path: filePath,
          error: 'File not found',
        });
        continue;
      }

      // Check if it's a directory
      const stats = await fs.stat(resolvedPath);
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
      results.push({
        success: false,
        path: filePath,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
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
    console.log(
      JSON.stringify([
        {
          success: false,
          path: '',
          error: 'No file paths provided',
        },
      ])
    );
    process.exit(1);
  }

  // All arguments are file paths to delete
  const paths = args;

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
