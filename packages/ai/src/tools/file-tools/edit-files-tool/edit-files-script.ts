import * as fs from 'node:fs/promises';
import * as path from 'node:path';

interface FileEdit {
  filePath: string;
  findString: string;
  replaceString: string;
}

interface FileEditResult {
  success: boolean;
  filePath: string;
  message?: string;
  error?: string;
}

async function editFiles(edits: FileEdit[]): Promise<FileEditResult[]> {
  const results: FileEditResult[] = [];

  // Process files sequentially to avoid race conditions
  for (const { filePath, findString, replaceString } of edits) {
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

      const escapedFindString = findString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const occurrences = (content.match(new RegExp(escapedFindString, 'g')) || []).length;

      if (occurrences === 0) {
        results.push({
          success: false,
          filePath,
          error: `Find string not found in file: "${findString}"`,
        });
        continue;
      }

      if (occurrences > 1) {
        results.push({
          success: false,
          filePath,
          error: `Find string appears ${occurrences} times in file. Please use a more specific string that appears exactly once: "${findString}"`,
        });
        continue;
      }

      const updatedContent = content.replace(new RegExp(escapedFindString, 'g'), replaceString);
      await fs.writeFile(resolvedPath, updatedContent, 'utf-8');

      results.push({
        success: true,
        filePath,
        message: `Successfully replaced "${findString}" with "${replaceString}" in ${filePath}`,
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

  let edits: FileEdit[];
  try {
    // The first argument should be a JSON string containing the edits array
    const firstArg = args[0];
    if (!firstArg) {
      throw new Error('No argument provided');
    }
    edits = JSON.parse(firstArg);

    if (!Array.isArray(edits)) {
      throw new Error('Input must be an array of edits');
    }

    // Validate each edit has required fields
    for (const edit of edits) {
      if (!edit.filePath || !edit.findString || edit.replaceString === undefined) {
        throw new Error('Each edit must have filePath, findString, and replaceString properties');
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

  const results = await editFiles(edits);

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
