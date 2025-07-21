import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export interface FileEditResult {
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

export async function editFilesSafely(
  edits: Array<{ filePath: string; findString: string; replaceString: string }>
): Promise<FileEditResult[]> {
  const editPromises = edits.map((edit) =>
    editSingleFile(edit.filePath, edit.findString, edit.replaceString)
  );
  return Promise.all(editPromises);
}

/**
 * Generates TypeScript code that can be executed in a sandbox to edit files
 * The generated code is self-contained and outputs results as JSON to stdout
 */
export function generateFileEditCode(
  edits: Array<{ filePath: string; findString: string; replaceString: string }>
): string {
  return `
const fs = require('fs');
const path = require('path');

function editSingleFile(filePath, findString, replaceString) {
  try {
    const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);

    try {
      fs.accessSync(resolvedPath);
    } catch {
      return {
        success: false,
        filePath,
        error: 'File not found',
      };
    }

    const content = fs.readFileSync(resolvedPath, 'utf-8');
    
    const occurrences = content.split(findString).length - 1;

    if (occurrences === 0) {
      return {
        success: false,
        filePath,
        error: \`Find string not found in file: "\${findString}"\`,
      };
    }

    if (occurrences > 1) {
      return {
        success: false,
        filePath,
        error: \`Find string appears \${occurrences} times in file. Please use a more specific string that appears exactly once: "\${findString}"\`,
      };
    }

    const updatedContent = content.replace(findString, replaceString);
    fs.writeFileSync(resolvedPath, updatedContent, 'utf-8');

    return {
      success: true,
      filePath,
      message: \`Successfully replaced "\${findString}" with "\${replaceString}" in \${filePath}\`,
    };
  } catch (error) {
    return {
      success: false,
      filePath,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

function editFilesConcurrently(edits) {
  return edits.map((edit) => 
    editSingleFile(edit.filePath, edit.findString, edit.replaceString)
  );
}

const edits = ${JSON.stringify(edits)};
const results = editFilesConcurrently(edits);
console.log(JSON.stringify(results));
  `.trim();
}
