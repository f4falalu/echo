import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export interface FileCreateResult {
  success: boolean;
  filePath: string;
  error?: string;
}

export interface FileCreateParams {
  path: string;
  content: string;
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

export async function createFilesSafely(fileParams: FileCreateParams[]): Promise<FileCreateResult[]> {
  const fileCreatePromises = fileParams.map((params) => createSingleFile(params));
  return Promise.all(fileCreatePromises);
}

/**
 * Generates TypeScript code that can be executed in a sandbox to create files
 * The generated code is self-contained and outputs results as JSON to stdout
 */
export function generateFileCreateCode(fileParams: FileCreateParams[]): string {
  return `
const fs = require('fs');
const path = require('path');

function createSingleFile(fileParams) {
  try {
    const { path: filePath, content } = fileParams;
    const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);

    const dirPath = path.dirname(resolvedPath);
    try {
      fs.mkdirSync(dirPath, { recursive: true });
    } catch (error) {
      return {
        success: false,
        filePath,
        error: \`Failed to create directory: \${error instanceof Error ? error.message : 'Unknown error'}\`,
      };
    }

    fs.writeFileSync(resolvedPath, content, 'utf-8');

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

function createFilesConcurrently(fileParams) {
  return fileParams.map((params) => createSingleFile(params));
}

const fileParams = ${JSON.stringify(fileParams)};
const results = createFilesConcurrently(fileParams);
console.log(JSON.stringify(results));
  `.trim();
}
