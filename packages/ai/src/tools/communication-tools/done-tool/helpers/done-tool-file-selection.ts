import type { ChatMessageResponseMessage } from '@buster/server-shared/chats';
import type { ModelMessage } from 'ai';
import * as yaml from 'yaml';
import { CREATE_DASHBOARDS_TOOL_NAME } from '../../../visualization-tools/dashboards/create-dashboards-tool/create-dashboards-tool';
import type { CreateDashboardsOutput } from '../../../visualization-tools/dashboards/create-dashboards-tool/create-dashboards-tool';
import { MODIFY_DASHBOARDS_TOOL_NAME } from '../../../visualization-tools/dashboards/modify-dashboards-tool/modify-dashboards-tool';
import type { ModifyDashboardsOutput } from '../../../visualization-tools/dashboards/modify-dashboards-tool/modify-dashboards-tool';
import { CREATE_METRICS_TOOL_NAME } from '../../../visualization-tools/metrics/create-metrics-tool/create-metrics-tool';
import type { CreateMetricsOutput } from '../../../visualization-tools/metrics/create-metrics-tool/create-metrics-tool';
import { MODIFY_METRICS_TOOL_NAME } from '../../../visualization-tools/metrics/modify-metrics-tool/modify-metrics-tool';
import type { ModifyMetricsOutput } from '../../../visualization-tools/metrics/modify-metrics-tool/modify-metrics-tool';
import { CREATE_REPORTS_TOOL_NAME } from '../../../visualization-tools/reports/create-reports-tool/create-reports-tool';
import type { CreateReportsOutput } from '../../../visualization-tools/reports/create-reports-tool/create-reports-tool';
import { MODIFY_REPORTS_TOOL_NAME } from '../../../visualization-tools/reports/modify-reports-tool/modify-reports-tool';
import type { ModifyReportsOutput } from '../../../visualization-tools/reports/modify-reports-tool/modify-reports-tool';

// File tracking type similar to ExtractedFile from file-selection.ts
interface ExtractedFile {
  id: string;
  fileType: 'metric' | 'dashboard' | 'report';
  fileName: string;
  status: 'completed' | 'failed' | 'loading';
  operation?: 'created' | 'modified' | undefined;
  versionNumber?: number | undefined;
  parentDashboardId?: string | undefined; // Track which dashboard contains this metric
}

// Track dashboard-metric relationships
interface DashboardMetricRelationship {
  dashboardId: string;
  metricIds: string[];
}

// Type for tool call content in assistant messages
interface ToolCallContent {
  type: 'tool-call';
  toolName: string;
  input: unknown;
  toolCallId: string;
}

/**
 * Extract files from tool call responses in the conversation messages
 * Scans both tool results and assistant messages for file information
 */
export function extractFilesFromToolCalls(messages: ModelMessage[]): ExtractedFile[] {
  const files: ExtractedFile[] = [];
  const dashboardMetricRelationships: DashboardMetricRelationship[] = [];

  console.info('[done-tool-file-selection] Starting file extraction from messages', {
    messageCount: messages.length,
  });

  // First pass: Extract all files and build dashboard-metric relationships
  for (const message of messages) {
    if (message.role === 'assistant') {
      // Look for tool calls in assistant messages
      if (Array.isArray(message.content)) {
        for (const content of message.content) {
          if (content && typeof content === 'object') {
            // Check if this is a tool call - the trace shows structure like:
            // { type: 'tool-call', toolName: 'createMetrics', input: {...}, toolCallId: '...' }
            const contentObj = content as ToolCallContent;

            if (contentObj.type === 'tool-call' && contentObj.toolName && contentObj.input) {
              console.info('[done-tool-file-selection] Found tool call', {
                toolName: contentObj.toolName,
                hasInput: !!contentObj.input,
                toolCallId: contentObj.toolCallId,
              });

              // Handle different tool types
              switch (contentObj.toolName) {
                case CREATE_DASHBOARDS_TOOL_NAME:
                  extractDashboardMetricRelationships(
                    contentObj.input,
                    dashboardMetricRelationships
                  );
                  extractFilesFromToolInput(contentObj.input, 'dashboard', files);
                  break;

                case CREATE_METRICS_TOOL_NAME:
                  extractFilesFromToolInput(contentObj.input, 'metric', files);
                  break;

                case CREATE_REPORTS_TOOL_NAME:
                  extractFilesFromToolInput(contentObj.input, 'report', files);
                  break;

                case MODIFY_DASHBOARDS_TOOL_NAME:
                  extractFilesFromToolInput(contentObj.input, 'dashboard', files, 'modified');
                  break;

                case MODIFY_METRICS_TOOL_NAME:
                  extractFilesFromToolInput(contentObj.input, 'metric', files, 'modified');
                  break;

                case MODIFY_REPORTS_TOOL_NAME:
                  extractFilesFromToolInput(contentObj.input, 'report', files, 'modified');
                  break;
              }
            }
          }
          // Also extract files from structured content
          extractFilesFromStructuredContent(content, files);
        }
      } else if (typeof message.content === 'string') {
        extractFilesFromAssistantMessage(message.content, files);
      }
    } else if (message.role === 'tool') {
      // Tool messages have content that contains the tool result
      const toolContent = message.content;

      // Parse tool results based on content structure
      if (Array.isArray(toolContent)) {
        // Handle array of tool results
        for (const result of toolContent) {
          if (result && typeof result === 'object' && 'result' in result) {
            processToolOutput(result.result, files, dashboardMetricRelationships);
          }
        }
      } else if (toolContent && typeof toolContent === 'object') {
        // Handle single tool result object
        processToolOutput(toolContent, files, dashboardMetricRelationships);
      }
    }
  }

  console.info('[done-tool-file-selection] Extracted files before deduplication', {
    totalFiles: files.length,
    metrics: files.filter((f) => f.fileType === 'metric').length,
    dashboards: files.filter((f) => f.fileType === 'dashboard').length,
    reports: files.filter((f) => f.fileType === 'report').length,
    relationships: dashboardMetricRelationships.length,
  });

  // Deduplicate files by ID, keeping highest version
  const deduplicatedFiles = deduplicateFilesByVersion(files);

  console.info('[done-tool-file-selection] After deduplication', {
    totalFiles: deduplicatedFiles.length,
    fileIds: deduplicatedFiles.map((f) => ({ id: f.id, type: f.fileType, operation: f.operation })),
  });

  // Apply selection rules based on file types and relationships
  const selectedFiles = applyFileSelectionRules(deduplicatedFiles, dashboardMetricRelationships);

  console.info('[done-tool-file-selection] Final selected files', {
    totalSelected: selectedFiles.length,
    selectedIds: selectedFiles.map((f) => ({ id: f.id, type: f.fileType, name: f.fileName })),
  });

  return selectedFiles;
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
  if (
    file.id &&
    (file.file_type || file.fileType) &&
    (file.file_name || file.fileName || file.name)
  ) {
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
function processToolOutput(
  output: unknown,
  files: ExtractedFile[],
  _dashboardMetricRelationships: DashboardMetricRelationship[]
): void {
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

        // Extract metric IDs from dashboard content if available
        // This requires looking at the original tool call arguments
        // We'll track relationships when we see createDashboards tool calls
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
      return (
        'id' in fileObj &&
        'name' in fileObj &&
        'version_number' in fileObj &&
        'content' in fileObj &&
        'updated_at' in fileObj
      );
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
 * Extract dashboard-metric relationships from createDashboards tool arguments
 */
function extractDashboardMetricRelationships(
  args: unknown,
  relationships: DashboardMetricRelationship[]
): void {
  console.info('[done-tool-file-selection] Extracting dashboard-metric relationships from args');
  try {
    const argsObj = args as Record<string, unknown>;
    if (argsObj.files && Array.isArray(argsObj.files)) {
      console.info('[done-tool-file-selection] Found files in args', {
        fileCount: argsObj.files.length,
      });
      for (const file of argsObj.files as Record<string, unknown>[]) {
        if (file.yml_content) {
          // Parse the YAML content to extract metric IDs
          try {
            const dashboardYaml = yaml.parse(file.yml_content as string);
            if (dashboardYaml?.rows && Array.isArray(dashboardYaml.rows)) {
              const metricIds: string[] = [];
              for (const row of dashboardYaml.rows) {
                if (row.items && Array.isArray(row.items)) {
                  for (const item of row.items) {
                    if (item.id) {
                      metricIds.push(item.id);
                    }
                  }
                }
              }

              // We don't have the dashboard ID yet (it's generated during execution),
              // but we can use the dashboard name as a temporary identifier
              // and update it later when we see the result
              if (metricIds.length > 0 && file.name) {
                console.info('[done-tool-file-selection] Found dashboard with metrics', {
                  dashboardName: file.name,
                  metricIds,
                });
                relationships.push({
                  dashboardId: file.name as string, // Use name as temporary ID
                  metricIds,
                });
              }
            }
          } catch (yamlError) {
            // Ignore YAML parsing errors
            console.warn('Failed to parse dashboard YAML for relationships:', yamlError);
          }
        }
      }
    }
  } catch (error) {
    // Ignore errors in relationship extraction
    console.warn('Failed to extract dashboard-metric relationships:', error);
  }
}

/**
 * Apply file selection rules based on file types and relationships
 * Rules:
 * 1. If only metrics are created → show all metrics
 * 2. If only dashboards are created → show only dashboards
 * 3. If a metric that belongs to a dashboard is modified → show the parent dashboard
 */
function applyFileSelectionRules(
  files: ExtractedFile[],
  relationships: DashboardMetricRelationship[]
): ExtractedFile[] {
  console.info('[done-tool-file-selection] Applying selection rules', {
    totalFiles: files.length,
    relationships: relationships.length,
  });

  // Separate files by type
  const metrics = files.filter((f) => f.fileType === 'metric');
  const dashboards = files.filter((f) => f.fileType === 'dashboard');
  const reports = files.filter((f) => f.fileType === 'report');

  console.info('[done-tool-file-selection] Files by type', {
    metrics: metrics.map((m) => ({ id: m.id, name: m.fileName, operation: m.operation })),
    dashboards: dashboards.map((d) => ({ id: d.id, name: d.fileName, operation: d.operation })),
    reports: reports.length,
  });

  // Build a map of metric ID to dashboard IDs (a metric can belong to multiple dashboards)
  const metricToDashboards = new Map<string, Set<string>>();

  // First, map dashboard names to their IDs from the files
  const dashboardNameToId = new Map<string, string>();
  for (const dashboard of dashboards) {
    dashboardNameToId.set(dashboard.fileName, dashboard.id);
  }

  // Then build the metric-to-dashboard mapping
  for (const relationship of relationships) {
    // Try to find the actual dashboard ID from the name
    const dashboardId = dashboardNameToId.get(relationship.dashboardId) || relationship.dashboardId;

    console.info('[done-tool-file-selection] Processing relationship', {
      dashboardIdOrName: relationship.dashboardId,
      resolvedDashboardId: dashboardId,
      metricIds: relationship.metricIds,
    });

    for (const metricId of relationship.metricIds) {
      if (!metricToDashboards.has(metricId)) {
        metricToDashboards.set(metricId, new Set());
      }
      metricToDashboards.get(metricId)?.add(dashboardId);
    }
  }

  console.info('[done-tool-file-selection] Metric to dashboard mapping', {
    mappings: Array.from(metricToDashboards.entries()).map(([metricId, dashboardIds]) => ({
      metricId,
      belongsToDashboards: Array.from(dashboardIds),
    })),
  });

  // Note: Dashboard-metric relationships are handled by the relationship extraction above

  // Apply selection rules
  const selectedFiles: ExtractedFile[] = [];

  // Always include reports
  selectedFiles.push(...reports);

  // Check if we have both metrics and dashboards
  const hasMetrics = metrics.length > 0;
  const hasDashboards = dashboards.length > 0;

  if (hasMetrics && !hasDashboards) {
    // Rule 1: Only metrics exist → show all metrics
    console.info('[done-tool-file-selection] Rule 1: Only metrics exist, showing all metrics');
    selectedFiles.push(...metrics);
  } else if (hasDashboards && !hasMetrics) {
    // Rule 2: Only dashboards exist → show dashboards
    console.info('[done-tool-file-selection] Rule 2: Only dashboards exist, showing dashboards');
    selectedFiles.push(...dashboards);
  } else if (hasMetrics && hasDashboards) {
    console.info('[done-tool-file-selection] Both metrics and dashboards exist');
    // We have both metrics and dashboards
    // Check if any modified metrics belong to dashboards
    const modifiedMetrics = metrics.filter((m) => m.operation === 'modified');
    const parentDashboardIds = new Set<string>();

    console.info('[done-tool-file-selection] Checking for modified metrics', {
      modifiedMetrics: modifiedMetrics.map((m) => ({ id: m.id, name: m.fileName })),
    });

    for (const metric of modifiedMetrics) {
      const dashboardIds = metricToDashboards.get(metric.id);
      if (dashboardIds) {
        console.info('[done-tool-file-selection] Modified metric belongs to dashboards', {
          metricId: metric.id,
          dashboardIds: Array.from(dashboardIds),
        });
        dashboardIds.forEach((id) => parentDashboardIds.add(id));
      }
    }

    // If modified metrics belong to dashboards, show those dashboards
    if (parentDashboardIds.size > 0) {
      console.info(
        '[done-tool-file-selection] Rule 3: Modified metrics belong to dashboards, showing parent dashboards',
        {
          parentDashboardIds: Array.from(parentDashboardIds),
        }
      );
      const parentDashboards = dashboards.filter((d) => parentDashboardIds.has(d.id));
      selectedFiles.push(...parentDashboards);

      // Also include any standalone metrics (not in dashboards)
      const standaloneMetrics = metrics.filter((m) => !metricToDashboards.has(m.id));
      console.info('[done-tool-file-selection] Including standalone metrics', {
        standaloneMetrics: standaloneMetrics.map((m) => ({ id: m.id, name: m.fileName })),
      });
      selectedFiles.push(...standaloneMetrics);
    } else {
      // Default: show dashboards if they exist, otherwise show metrics
      if (dashboards.length > 0) {
        console.info('[done-tool-file-selection] Default: Showing dashboards');
        selectedFiles.push(...dashboards);
      } else {
        console.info('[done-tool-file-selection] Default: No dashboards, showing metrics');
        selectedFiles.push(...metrics);
      }
    }
  }

  // Remove duplicates
  const uniqueFiles = new Map<string, ExtractedFile>();
  for (const file of selectedFiles) {
    if (
      !uniqueFiles.has(file.id) ||
      (file.versionNumber || 1) > (uniqueFiles.get(file.id)?.versionNumber || 1)
    ) {
      uniqueFiles.set(file.id, file);
    }
  }

  return Array.from(uniqueFiles.values());
}

/**
 * Extract files from tool input (for tool calls in assistant messages)
 */
function extractFilesFromToolInput(
  input: unknown,
  fileType: 'metric' | 'dashboard' | 'report',
  files: ExtractedFile[],
  operation: 'created' | 'modified' = 'created'
): void {
  if (!input || typeof input !== 'object') return;

  const inputObj = input as Record<string, unknown>;

  // Handle files array in input
  if (inputObj.files && Array.isArray(inputObj.files)) {
    for (const file of inputObj.files as Record<string, unknown>[]) {
      if (file.name) {
        const fileName = file.name as string;
        // Generate a temporary ID based on file type and name
        const tempId = `${fileType}_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}_temp`;

        files.push({
          id: tempId,
          fileType,
          fileName,
          status: 'loading' as const,
          operation,
          versionNumber: 1,
        });

        console.info('[done-tool-file-selection] Extracted file from tool input', {
          tempId,
          fileType,
          fileName,
          operation,
        });
      }
    }
  }

  // Handle single file in input (for modify tools)
  if (inputObj.file && typeof inputObj.file === 'object') {
    const file = inputObj.file as Record<string, unknown>;
    if (file.name || file.id) {
      const fileName = (file.name || file.id) as string;
      const tempId = `${fileType}_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}_temp`;

      files.push({
        id: tempId,
        fileType,
        fileName,
        status: 'loading' as const,
        operation,
        versionNumber: 1,
      });

      console.info('[done-tool-file-selection] Extracted single file from tool input', {
        tempId,
        fileType,
        fileName,
        operation,
      });
    }
  }
}

/**
 * Create file response messages for selected files
 */
export function createFileResponseMessages(files: ExtractedFile[]): ChatMessageResponseMessage[] {
  return files.map((file) => {
    // Determine the display name for the file type
    const fileTypeDisplay =
      file.fileType === 'dashboard'
        ? 'Dashboard'
        : file.fileType === 'metric'
          ? 'Metric'
          : file.fileType === 'report'
            ? 'Report'
            : file.fileType;

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
