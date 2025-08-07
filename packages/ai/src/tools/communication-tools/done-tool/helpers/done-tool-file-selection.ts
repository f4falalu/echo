import type { ChatMessageResponseMessage } from '@buster/server-shared/chats';
import type { ModelMessage } from 'ai';
import type { CreateDashboardsOutput } from '../../../visualization-tools/create-dashboards-tool/create-dashboards-tool';
import type { CreateMetricsOutput } from '../../../visualization-tools/create-metrics-tool/create-metrics-tool';
import type { ModifyDashboardsOutput } from '../../../visualization-tools/modify-dashboards-tool/modify-dashboards-tool';
import type { ModifyMetricsOutput } from '../../../visualization-tools/modify-metrics-tool/modify-metrics-tool';

// File tracking type similar to ExtractedFile from file-selection.ts
interface ExtractedFile {
  id: string;
  fileType: 'metric' | 'dashboard';
  fileName: string;
  status: 'completed' | 'failed' | 'loading';
  operation?: 'created' | 'modified' | undefined;
  versionNumber?: number | undefined;
}

/**
 * Extract files from tool call responses in the conversation messages
 * Uses proper TypeScript types to identify and extract visualization tool outputs
 */
export function extractFilesFromToolCalls(messages: ModelMessage[]): ExtractedFile[] {
  const files: ExtractedFile[] = [];

  // Iterate through messages to find tool call results
  for (const message of messages) {
    if (message.role === 'tool') {
      // Tool messages have content that contains the tool result
      const toolContent = message.content;

      // Parse tool results based on content structure
      if (Array.isArray(toolContent)) {
        // Handle array of tool results
        for (const result of toolContent) {
          if (result && typeof result === 'object' && 'output' in result) {
            processToolOutput(result.output, files);
          }
        }
      } else if (toolContent && typeof toolContent === 'object') {
        // Handle single tool result object
        processToolOutput(toolContent, files);
      }
    }
  }

  // Deduplicate files by ID, keeping highest version
  return deduplicateFilesByVersion(files);
}

/**
 * Process a tool output and extract file information
 */
function processToolOutput(output: unknown, files: ExtractedFile[]): void {
  // Check if this is a metrics tool output
  if (isMetricsToolOutput(output)) {
    const operation = detectOperation(output.message);

    // Extract successfully created/modified metric files
    if (output.files && Array.isArray(output.files)) {
      for (const file of output.files) {
        files.push({
          id: file.id,
          fileType: 'metric',
          fileName: file.name,
          status: 'completed',
          operation,
          versionNumber: file.version_number,
        });
      }
    }
  }

  // Check if this is a dashboards tool output
  if (isDashboardsToolOutput(output)) {
    const operation = detectOperation(output.message);

    // Extract successfully created/modified dashboard files
    if (output.files && Array.isArray(output.files)) {
      for (const file of output.files) {
        files.push({
          id: file.id,
          fileType: 'dashboard',
          fileName: file.name,
          status: 'completed',
          operation,
          versionNumber: file.version_number,
        });
      }
    }
  }
}

/**
 * Type guard to check if output is from create/modify metrics tool
 */
function isMetricsToolOutput(output: unknown): output is CreateMetricsOutput | ModifyMetricsOutput {
  if (!output || typeof output !== 'object') return false;

  const obj = output as Record<string, unknown>;

  // Check for required properties
  if (!('files' in obj) || !('message' in obj)) return false;
  if (!Array.isArray(obj.files)) return false;

  // Check if all files are metrics
  return obj.files.every((file: unknown) => {
    if (!file || typeof file !== 'object') return false;
    const fileObj = file as Record<string, unknown>;
    return fileObj.file_type === 'metric';
  });
}

/**
 * Type guard to check if output is from create/modify dashboards tool
 */
function isDashboardsToolOutput(
  output: unknown
): output is CreateDashboardsOutput | ModifyDashboardsOutput {
  if (!output || typeof output !== 'object') return false;

  const obj = output as Record<string, unknown>;

  // Check for required properties
  if (!('files' in obj) || !('message' in obj)) return false;
  if (!Array.isArray(obj.files)) return false;

  // Check if all files are dashboards
  return obj.files.every((file: unknown) => {
    if (!file || typeof file !== 'object') return false;
    const fileObj = file as Record<string, unknown>;
    return fileObj.file_type === 'dashboard';
  });
}

/**
 * Detect if files were created or modified based on the message
 */
function detectOperation(message: string): 'created' | 'modified' | undefined {
  if (!message) return undefined;

  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('modified') || lowerMessage.includes('updated')) {
    return 'modified';
  }
  if (lowerMessage.includes('created') || lowerMessage.includes('creating')) {
    return 'created';
  }

  return 'created'; // Default to created if not specified
}

/**
 * Deduplicate files by ID, keeping the highest version number
 */
function deduplicateFilesByVersion(files: ExtractedFile[]): ExtractedFile[] {
  const deduplicated = new Map<string, ExtractedFile>();

  for (const file of files) {
    const existingFile = deduplicated.get(file.id);
    const fileVersion = file.versionNumber || 1;
    const existingVersion = existingFile?.versionNumber || 1;

    if (!existingFile || fileVersion > existingVersion) {
      deduplicated.set(file.id, file);
    }
  }

  return Array.from(deduplicated.values());
}

/**
 * Create file response messages for selected files
 */
export function createFileResponseMessages(files: ExtractedFile[]): ChatMessageResponseMessage[] {
  return files.map((file) => ({
    id: file.id,
    type: 'file' as const,
    file_type: file.fileType,
    file_name: file.fileName,
    version_number: file.versionNumber || 1,
    filter_version_id: null,
    metadata: [
      {
        status: 'completed' as const,
        message: `${file.fileType === 'dashboard' ? 'Dashboard' : 'Metric'} ${file.operation || 'created'} successfully`,
        timestamp: Date.now(),
      },
    ],
  }));
}
