import * as fs from 'node:fs/promises';
import * as path from 'node:path';

interface FileCreateParams {
  path: string;
  content: string;
}

interface FileCreateResult {
  success: boolean;
  filePath: string;
  error?: string;
}

async function createFiles(fileParams: FileCreateParams[]): Promise<FileCreateResult[]> {
  const results: FileCreateResult[] = [];
  const createdDirs = new Set<string>();

  // Process files sequentially to avoid race conditions
  for (const { path: filePath, content } of fileParams) {
    try {
      const resolvedPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(process.cwd(), filePath);
      const dirPath = path.dirname(resolvedPath);

      // Only create directory if we haven't already created it
      if (!createdDirs.has(dirPath)) {
        try {
          await fs.mkdir(dirPath, { recursive: true });
          createdDirs.add(dirPath);
        } catch (error) {
          results.push({
            success: false,
            filePath,
            error: `Failed to create directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
          continue;
        }
      }

      await fs.writeFile(resolvedPath, content, 'utf-8');

      results.push({
        success: true,
        filePath,
      });
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

  if (args.length === 0) {
    console.log(
      JSON.stringify([
        {
          success: false,
          filePath: '',
          error: 'No arguments provided to script',
        },
      ])
    );
    process.exit(1);
  }

  let fileParams: FileCreateParams[];
  try {
    // The script expects file parameters as a JSON string in the first argument (possibly base64 encoded)
    let fileParamsJson = args[0];
    if (!fileParamsJson) {
      throw new Error('No argument provided');
    }

    // Try to decode from base64 if it looks like base64
    if (
      fileParamsJson &&
      /^[A-Za-z0-9+/]+=*$/.test(fileParamsJson) &&
      fileParamsJson.length % 4 === 0
    ) {
      try {
        fileParamsJson = Buffer.from(fileParamsJson, 'base64').toString('utf-8');
      } catch {
        // If base64 decode fails, use as-is
      }
    }

    fileParams = JSON.parse(fileParamsJson);

    if (!Array.isArray(fileParams)) {
      throw new Error('File parameters must be an array');
    }

    // Validate each file parameter
    for (const param of fileParams) {
      if (!param.path || typeof param.path !== 'string') {
        throw new Error('Each file parameter must have a valid path string');
      }
      if (typeof param.content !== 'string') {
        throw new Error('Each file parameter must have a content string');
      }
    }
  } catch (error) {
    // Return error information instead of empty array
    console.log(
      JSON.stringify([
        {
          success: false,
          filePath: '',
          error: `Failed to parse arguments: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ])
    );
    process.exit(1);
  }

  const results = await createFiles(fileParams);

  // Output as JSON to stdout
  console.log(JSON.stringify(results));
}

// Run the script
main().catch((error) => {
  // Return error information for unexpected errors
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
