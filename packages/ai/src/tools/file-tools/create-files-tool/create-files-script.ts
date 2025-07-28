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

async function createSingleFile(fileParams: FileCreateParams): Promise<FileCreateResult> {
  try {
    const { path: filePath, content } = fileParams;
    const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);

    const dirPath = path.dirname(resolvedPath);
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      return {
        success: false,
        filePath,
        error: `Failed to create directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }

    await fs.writeFile(resolvedPath, content, 'utf-8');

    return {
      success: true,
      filePath,
    };
  } catch (error) {
    return {
      success: false,
      filePath: fileParams.path,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

async function createFilesSafely(fileParams: FileCreateParams[]): Promise<FileCreateResult[]> {
  const fileCreatePromises = fileParams.map((params) => createSingleFile(params));
  return Promise.all(fileCreatePromises);
}

// Script execution
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(
      JSON.stringify({
        success: false,
        error: 'No file parameters provided',
      })
    );
    process.exit(1);
  }

  let fileParams: FileCreateParams[];
  try {
    // The script expects file parameters as a JSON string in the first argument
    fileParams = JSON.parse(args[0]);

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
    console.error(
      JSON.stringify({
        success: false,
        error: `Invalid file parameters: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    );
    process.exit(1);
  }

  const results = await createFilesSafely(fileParams);

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

