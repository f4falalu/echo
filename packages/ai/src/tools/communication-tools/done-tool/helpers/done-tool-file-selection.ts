import type { ChatMessageResponseMessage } from '@buster/server-shared/chats';
import type { ModelMessage } from 'ai';
import type { CreateDashboardsOutput } from '../../../visualization-tools/dashboards/create-dashboards-tool/create-dashboards-tool';
import type { ModifyDashboardsOutput } from '../../../visualization-tools/dashboards/modify-dashboards-tool/modify-dashboards-tool';
import type { CreateMetricsOutput } from '../../../visualization-tools/metrics/create-metrics-tool/create-metrics-tool';
import type { ModifyMetricsOutput } from '../../../visualization-tools/metrics/modify-metrics-tool/modify-metrics-tool';
import type { CreateReportsOutput } from '../../../visualization-tools/reports/create-reports-tool/create-reports-tool';
import type { ModifyReportsOutput } from '../../../visualization-tools/reports/modify-reports-tool/modify-reports-tool';

// File tracking type similar to ExtractedFile from file-selection.ts
interface ExtractedFile {
  id: string;
  fileType: 'metric' | 'dashboard' | 'report';
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

  // Check if this is a reports tool output
  if (isReportsToolOutput(output)) {
    const operation = detectOperation(output.message);

    // Extract successfully created/modified report files
    if (output.files && Array.isArray(output.files)) {
      for (const file of output.files) {
        files.push({
          id: file.id,
          fileType: 'report',
          fileName: file.name,
          status: 'completed',
          operation,
          versionNumber: file.version_number,
        });
      }
    }
    // For modify reports tool, extract from the file object
    if ('file' in output && output.file && typeof output.file === 'object') {
      const file = output.file as Record<string, unknown>;
      if (file.id && file.name && file.version_number) {
        files.push({
          id: file.id as string,
          fileType: 'report',
          fileName: file.name as string,
          status: 'completed',
          operation: 'modified',
          versionNumber: file.version_number as number,
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
 * Type guard to check if output is from create/modify reports tool
 */
function isReportsToolOutput(output: unknown): output is CreateReportsOutput | ModifyReportsOutput {
  if (!output || typeof output !== 'object') return false;

  const obj = output as Record<string, unknown>;

  // Check for create reports output structure
  if ('files' in obj && 'message' in obj && Array.isArray(obj.files)) {
    // Check if files have report-specific properties
    return obj.files.every((file: unknown) => {
      if (!file || typeof file !== 'object') return false;
      const fileObj = file as Record<string, unknown>;
      // Reports don't have file_type in the output, just id, name, version_number
      return 'id' in fileObj && 'name' in fileObj && 'version_number' in fileObj;
    });
  }

  // Check for modify reports output structure (has a single 'file' property)
  if ('success' in obj && 'message' in obj && 'file' in obj) {
    const file = obj.file;
    if (file && typeof file === 'object') {
      const fileObj = file as Record<string, unknown>;
      return 'id' in fileObj && 'name' in fileObj && 'version_number' in fileObj;
    }
  }

  return false;
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
  return files.map((file) => {
    // Determine the display name for the file type
    const fileTypeDisplay = 
      file.fileType === 'dashboard' ? 'Dashboard' : 
      file.fileType === 'metric' ? 'Metric' : 
      file.fileType === 'report' ? 'Report' : 
      file.fileType;

    return {
      id: file.id,
      type: 'file' as const,
      file_type: file.fileType as 'metric' | 'dashboard' | 'report',
      file_name: file.fileName,
      version_number: file.versionNumber || 1,
      filter_version_id: null,
      metadata: [
        {
          status: 'completed' as const,
          message: `${fileTypeDisplay} ${file.operation || 'created'} successfully`,
          timestamp: Date.now(),
        },
      ],
    };
  });
}
