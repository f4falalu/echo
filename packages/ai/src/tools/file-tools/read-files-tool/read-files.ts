import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export interface FileReadResult {
  success: boolean;
  filePath: string;
  content?: string;
  error?: string;
  truncated?: boolean;
}

async function readSingleFile(filePath: string): Promise<FileReadResult> {
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
    const lines = content.split('\n');

    if (lines.length > 1000) {
      const truncatedContent = lines.slice(0, 1000).join('\n');
      return {
        success: true,
        filePath,
        content: truncatedContent,
        truncated: true,
      };
    }

    return {
      success: true,
      filePath,
      content,
      truncated: false,
    };
  } catch (error) {
    return {
      success: false,
      filePath,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function readFilesSafely(filePaths: string[]): Promise<FileReadResult[]> {
  const fileReadPromises = filePaths.map((filePath) => readSingleFile(filePath));
  return Promise.all(fileReadPromises);
}

/**
 * Generates TypeScript code that can be executed in a sandbox to read files
 * The generated code is self-contained and outputs results as JSON to stdout
 */
export function generateFileReadCode(filePaths: string[]): string {
  return `
const fs = require('fs');
const path = require('path');

function readSingleFile(filePath: string) {
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
    const lines = content.split('\\n');

    if (lines.length > 1000) {
      const truncatedContent = lines.slice(0, 1000).join('\\n');
      return {
        success: true,
        filePath,
        content: truncatedContent,
        truncated: true,
      };
    }

    return {
      success: true,
      filePath,
      content,
      truncated: false,
    };
  } catch (error) {
    return {
      success: false,
      filePath,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

function readFilesConcurrently(filePaths: string[]) {
  return filePaths.map((filePath: string) => readSingleFile(filePath));
}

// Execute the file reading
const filePaths = ${JSON.stringify(filePaths)};
const results = readFilesConcurrently(filePaths);
console.log(JSON.stringify(results));
  `.trim();
}
