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
 * Scans both tool results and assistant messages for file information
 */
export function extractFilesFromToolCalls(messages: ModelMessage[]): ExtractedFile[] {
  const files: ExtractedFile[] = [];

  // Iterate through messages to find files
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
    } else if (message.role === 'assistant') {
      // Assistant messages might contain reasoning entries with files
      // Check if the content contains file information
      if (typeof message.content === 'string') {
        // Try to extract files from assistant content if it contains structured data
        extractFilesFromAssistantMessage(message.content, files);
      } else if (Array.isArray(message.content)) {
        // Handle structured content
        for (const content of message.content) {
          if (content && typeof content === 'object') {
            extractFilesFromStructuredContent(content, files);
          }
        }
      }
    }
  }

  // Deduplicate files by ID, keeping highest version
  return deduplicateFilesByVersion(files);
}

/**
 * Extract files from assistant message content
 */
function extractFilesFromAssistantMessage(content: string, files: ExtractedFile[]): void {
  // Assistant messages might contain JSON data or structured information about files
  // We'll try to parse it if it looks like it contains file data
  try {
    // Check if content contains file-like structures
    if (content.includes('"file_type"') || content.includes('"files"')) {
      // Try to extract JSON objects from the content
      const jsonMatches = content.match(/\{[^{}]*\}/g);
      if (jsonMatches) {
        for (const match of jsonMatches) {
          try {
            const obj = JSON.parse(match);
            if (obj && typeof obj === 'object') {
              processFileObject(obj, files);
            }
          } catch {
            // Ignore parse errors for individual matches
          }
        }
      }
    }
  } catch {
    // Ignore if we can't parse the content
  }
}

/**
 * Extract files from structured content (like tool calls or reasoning entries)
 */
function extractFilesFromStructuredContent(content: unknown, files: ExtractedFile[]): void {
  if (!content || typeof content !== 'object') return;
  
  const obj = content as Record<string, unknown>;
  
  // Check if this is a files reasoning entry
  if (obj.type === 'files' && obj.files && typeof obj.files === 'object') {
    const filesObj = obj.files as Record<string, unknown>;
    for (const fileId in filesObj) {
      const file = filesObj[fileId];
      if (file && typeof file === 'object') {
        processFileObject(file, files);
      }
    }
  }
  
  // Check if this contains file information directly
  if ('file_type' in obj && 'file_name' in obj && 'id' in obj) {
    processFileObject(obj, files);
  }
  
  // Recursively check nested structures
  for (const key in obj) {
    const value = obj[key];
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        for (const item of value) {
          extractFilesFromStructuredContent(item, files);
        }
      } else {
        extractFilesFromStructuredContent(value, files);
      }
    }
  }
}

/**
 * Process a file object and add it to the files array
 */
function processFileObject(obj: unknown, files: ExtractedFile[]): void {
  if (!obj || typeof obj !== 'object') return;
  
  const file = obj as Record<string, unknown>;
  
  // Check if this looks like a file object
  if (file.id && (file.file_type || file.fileType) && (file.file_name || file.fileName || file.name)) {
    const fileType = (file.file_type || file.fileType) as string;
    const fileName = (file.file_name || file.fileName || file.name) as string;
    const id = file.id as string;
    const versionNumber = (file.version_number || file.versionNumber || 1) as number;
    
    // Only add valid file types
    if (fileType === 'metric' || fileType === 'dashboard' || fileType === 'report') {
      files.push({
        id,
        fileType: fileType as 'metric' | 'dashboard' | 'report',
        fileName,
        status: 'completed',
        operation: 'created',
        versionNumber,
      });
    }
  }
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

  // Check if this is a create reports tool output
  if (isCreateReportsToolOutput(output)) {
    const operation = detectOperation(output.message);

    // Extract successfully created report files
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
  }

  // Check if this is a modify reports tool output
  if (isModifyReportsToolOutput(output)) {
    // For modify reports tool, extract from the file object
    if (output.file && typeof output.file === 'object') {
      files.push({
        id: output.file.id,
        fileType: 'report',
        fileName: output.file.name,
        status: 'completed',
        operation: 'modified',
        versionNumber: output.file.version_number,
      });
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
 * Type guard to check if output is from create reports tool
 */
function isCreateReportsToolOutput(output: unknown): output is CreateReportsOutput {
  if (!output || typeof output !== 'object') return false;

  const obj = output as Record<string, unknown>;

  // Check for create reports output structure
  if ('files' in obj && 'message' in obj && 'failed_files' in obj) {
    if (!Array.isArray(obj.files)) return false;
    
    // Check if files have report-specific properties (id, name, version_number)
    return obj.files.every((file: unknown) => {
      if (!file || typeof file !== 'object') return false;
      const fileObj = file as Record<string, unknown>;
      return 'id' in fileObj && 'name' in fileObj && 'version_number' in fileObj;
    });
  }

  return false;
}

/**
 * Type guard to check if output is from modify reports tool
 */
function isModifyReportsToolOutput(output: unknown): output is ModifyReportsOutput {
  if (!output || typeof output !== 'object') return false;

  const obj = output as Record<string, unknown>;

  // Check for modify reports output structure (has success, message, and file properties)
  if ('success' in obj && 'message' in obj && 'file' in obj) {
    const file = obj.file;
    if (file && typeof file === 'object') {
      const fileObj = file as Record<string, unknown>;
      // Check for required file properties
      return 'id' in fileObj && 'name' in fileObj && 'version_number' in fileObj && 'content' in fileObj && 'updated_at' in fileObj;
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
