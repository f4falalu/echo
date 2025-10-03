import path from 'node:path';
import type {
  ReadFileToolContext,
  ReadFileToolInput,
  ReadFileToolOutput,
} from './read-file-tool';

const MAX_LINES = 1000;

/**
 * Validates that a file path is safe and within the project directory
 * @param filePath - The file path to validate
 * @param projectDirectory - The root directory of the project
 * @throws Error if the path is unsafe or outside the project
 */
function validateFilePath(filePath: string, projectDirectory: string): void {
  // Convert to absolute path if relative
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(projectDirectory, filePath);

  // Normalize to resolve any '..' or '.' components
  const normalizedPath = path.normalize(absolutePath);
  const normalizedProject = path.normalize(projectDirectory);

  // Ensure the resolved path is within the project directory
  if (!normalizedPath.startsWith(normalizedProject)) {
    throw new Error(`File ${filePath} is not in the current working directory ${projectDirectory}`);
  }
}

/**
 * Creates the execute function for the read files tool
 * @param context - The tool context containing messageId and project directory
 * @returns The execute function
 */
export function createReadFileToolExecute(context: ReadFileToolContext) {
  return async function execute(input: ReadFileToolInput): Promise<ReadFileToolOutput> {
    const { messageId, projectDirectory, onToolEvent } = context;
    const { filePath } = input;

    console.info(`Reading file ${filePath} for message ${messageId}`);

    // Emit start event
    onToolEvent?.({
      tool: 'readFileTool',
      event: 'start',
      args: input,
    });

    try {
      // Convert to absolute path if relative
      const absolutePath = path.isAbsolute(filePath)
        ? filePath
        : path.join(projectDirectory, filePath);

      // Validate the file path is within the project directory
      validateFilePath(absolutePath, projectDirectory);

      // Check if file exists
      const file = Bun.file(absolutePath);
      if (!(await file.exists())) {
        console.error(`File not found: ${filePath}`);
        return {
          status: 'error',
          file_path: filePath,
          error_message: 'File not found',
        };
      }

      // Read the file content
      const content = await file.text();
      const lines = content.split('\n');
      const truncated = lines.length > MAX_LINES;

      // Truncate if needed
      const finalContent = truncated ? lines.slice(0, MAX_LINES).join('\n') : content;

      console.info(`Successfully read file: ${filePath}`);

      const output = {
        status: 'success' as const,
        file_path: filePath,
        content: finalContent,
        truncated,
      };

      // Emit complete event
      onToolEvent?.({
        tool: 'readFileTool',
        event: 'complete',
        result: output,
        args: input,
      });

      return output;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error reading file ${filePath}:`, errorMessage);

      const output = {
        status: 'error' as const,
        file_path: filePath,
        error_message: errorMessage,
      };

      // Emit complete event even on error
      onToolEvent?.({
        tool: 'readFileTool',
        event: 'complete',
        result: output,
        args: input,
      });

      return output;
    }
  };
}
