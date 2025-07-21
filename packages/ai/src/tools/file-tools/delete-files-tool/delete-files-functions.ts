import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export interface FileDeleteResult {
  success: boolean;
  filePath: string;
  error?: string;
}

export interface FileDeleteParams {
  path: string;
}

async function deleteSingleFile(fileParams: FileDeleteParams): Promise<FileDeleteResult> {
  try {
    const { path: filePath } = fileParams;
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

    await fs.unlink(resolvedPath);

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

export async function deleteFilesSafely(
  fileParams: FileDeleteParams[]
): Promise<FileDeleteResult[]> {
  const fileDeletePromises = fileParams.map((params) => deleteSingleFile(params));
  return Promise.all(fileDeletePromises);
}

export function generateFileDeleteCode(fileParams: FileDeleteParams[]): string {
  return `
const fs = require('fs');
const path = require('path');

function deleteSingleFile(fileParams) {
  try {
    const { path: filePath } = fileParams;
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

    fs.unlinkSync(resolvedPath);

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

function deleteFilesConcurrently(fileParams) {
  return fileParams.map((params) => deleteSingleFile(params));
}

const fileParams = ${JSON.stringify(fileParams)};
const results = deleteFilesConcurrently(fileParams);
console.log(JSON.stringify(results));
  `.trim();
}
