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
    const resolvedPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);

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
    } else {
      return {
        success: true,
        filePath,
        content,
        truncated: false,
      };
    }
  } catch (error) {
    return {
      success: false,
      filePath,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function readFilesSafely(filePaths: string[]): Promise<FileReadResult[]> {
  const fileReadPromises = filePaths.map(filePath => readSingleFile(filePath));
  return Promise.all(fileReadPromises);
}
