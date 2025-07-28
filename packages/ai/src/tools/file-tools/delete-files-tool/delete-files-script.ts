import * as fs from 'node:fs/promises';
import * as path from 'node:path';

interface DeleteResult {
  success: boolean;
  path: string;
  error?: string;
}

async function deleteSingleFile(filePath: string): Promise<DeleteResult> {
  try {
    const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);

    try {
      await fs.access(resolvedPath);
    } catch {
      return {
        success: false,
        path: filePath,
        error: 'File not found',
      };
    }

    // Check if it's a directory
    const stats = await fs.stat(resolvedPath);
    if (stats.isDirectory()) {
      return {
        success: false,
        path: filePath,
        error: 'Cannot delete directories with this tool',
      };
    }

    await fs.unlink(resolvedPath);

    return {
      success: true,
      path: filePath,
    };
  } catch (error) {
    return {
      success: false,
      path: filePath,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

async function deleteFilesSafely(paths: string[]): Promise<DeleteResult[]> {
  const deletePromises = paths.map((filePath) => deleteSingleFile(filePath));
  return Promise.all(deletePromises);
}

// Script execution
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(JSON.stringify([]));
    return;
  }

  // All arguments are file paths to delete
  const paths = args;

  const results = await deleteFilesSafely(paths);

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
