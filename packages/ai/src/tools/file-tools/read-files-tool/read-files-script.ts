import * as fs from 'node:fs/promises';
import * as path from 'node:path';

interface FileReadResult {
  success: boolean;
  filePath: string;
  content?: string;
  error?: string;
  truncated?: boolean;
}

async function readFiles(filePaths: string[]): Promise<FileReadResult[]> {
  const results: FileReadResult[] = [];

  // Process files sequentially to avoid race conditions
  for (const filePath of filePaths) {
    try {
      const resolvedPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(process.cwd(), filePath);

      try {
        await fs.access(resolvedPath);
      } catch {
        results.push({
          success: false,
          filePath,
          error: 'File not found',
        });
        continue;
      }

      const content = await fs.readFile(resolvedPath, 'utf-8');
      const lines = content.split('\n');

      if (lines.length > 1000) {
        const truncatedContent = lines.slice(0, 1000).join('\n');
        results.push({
          success: true,
          filePath,
          content: truncatedContent,
          truncated: true,
        });
      } else {
        results.push({
          success: true,
          filePath,
          content,
          truncated: false,
        });
      }
    } catch (error) {
      results.push({
        success: false,
        filePath,
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

  // All arguments are file paths
  const filePaths = args;

  // Return error if no paths provided
  if (filePaths.length === 0) {
    console.log(
      JSON.stringify([
        {
          success: false,
          filePath: '',
          error: 'No file paths provided',
        },
      ])
    );
    process.exit(1);
  }

  const results = await readFiles(filePaths);

  // Output as JSON to stdout
  console.log(JSON.stringify(results));
}

// Run the script
main().catch((error) => {
  console.log(
    JSON.stringify([
      {
        success: false,
        filePath: '',
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
    ])
  );
  process.exit(1);
});
