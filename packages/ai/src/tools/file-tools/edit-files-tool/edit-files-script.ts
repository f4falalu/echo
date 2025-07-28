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

async function editSingleFile(
  filePath: string,
  findString: string,
  replaceString: string
): Promise<FileEditResult> {
  try {
    const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);

    try {
      await fs.access(resolvedPath);
    } catch {
      return {
        success: false,
        filePath,
        error: 'File not found',
      };
    }

    const content = await fs.readFile(resolvedPath, 'utf-8');

    const escapedFindString = findString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const occurrences = (content.match(new RegExp(escapedFindString, 'g')) || []).length;

    if (occurrences === 0) {
      return {
        success: false,
        filePath,
        error: `Find string not found in file: "${findString}"`,
      };
    }

    if (occurrences > 1) {
      return {
        success: false,
        filePath,
        error: `Find string appears ${occurrences} times in file. Please use a more specific string that appears exactly once: "${findString}"`,
      };
    }

    const updatedContent = content.replace(new RegExp(escapedFindString, 'g'), replaceString);
    await fs.writeFile(resolvedPath, updatedContent, 'utf-8');

    return {
      success: true,
      filePath,
      message: `Successfully replaced "${findString}" with "${replaceString}" in ${filePath}`,
    };
  } catch (error) {
    return {
      success: false,
      filePath,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

async function editFilesSafely(edits: FileEdit[]): Promise<FileEditResult[]> {
  const editPromises = edits.map((edit) =>
    editSingleFile(edit.filePath, edit.findString, edit.replaceString)
  );
  return Promise.all(editPromises);
}

// Script execution
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(
      JSON.stringify({
        success: false,
        error: 'No arguments provided. Expected JSON array of edits.',
      })
    );
    process.exit(1);
  }

  let edits: FileEdit[];
  try {
    // The first argument should be a JSON string containing the edits array
    edits = JSON.parse(args[0]);

    if (!Array.isArray(edits)) {
      throw new Error('Input must be an array of edits');
    }

    // Validate each edit has required fields
    for (const edit of edits) {
      if (!edit.filePath || !edit.findString || edit.replaceString === undefined) {
        throw new Error('Each edit must have filePath, findString, and replaceString properties');
      }
    }
  } catch (parseError) {
    console.error(
      JSON.stringify({
        success: false,
        error: `Failed to parse edits: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`,
      })
    );
    process.exit(1);
  }

  const results = await editFilesSafely(edits);

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
