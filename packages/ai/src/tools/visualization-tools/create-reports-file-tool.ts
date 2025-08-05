import { randomUUID } from 'node:crypto';
import { db } from '@buster/database';
import { assetPermissions, reportFiles } from '@buster/database';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import type { AnalystRuntimeContext } from '../../workflows/analyst-workflow';
import { trackFileAssociations } from './file-tracking-helper';

// Core interfaces matching the expected structure
interface ReportFileParams {
  name: string;
  content: string; // Markdown content
}

interface CreateReportFilesParams {
  files: ReportFileParams[];
}

interface FailedFileCreation {
  name: string;
  error: string;
}

interface FileWithId {
  id: string;
  name: string;
  file_type: string;
  result_message?: string;
  results?: Record<string, unknown>[];
  created_at: string;
  updated_at: string;
  version_number: number;
  content?: string;
}

interface CreateReportFilesOutput {
  message: string;
  duration: number;
  files: FileWithId[];
  failed_files: FailedFileCreation[];
}

// Validate markdown content
function validateMarkdownContent(content: string): {
  success: boolean;
  error?: string;
} {
  try {
    // Basic validation - ensure content is not empty and is a string
    if (!content || typeof content !== 'string') {
      return {
        success: false,
        error: 'Report content must be a non-empty string',
      };
    }

    // Check for reasonable length (not too short or too long)
    if (content.trim().length < 10) {
      return {
        success: false,
        error: 'Report content is too short. Please provide more detailed content.',
      };
    }

    if (content.length > 100000) {
      return {
        success: false,
        error: 'Report content is too long. Please keep reports under 100,000 characters.',
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Content validation failed',
    };
  }
}

// Process a report file creation request
async function processReportFile(file: ReportFileParams): Promise<{
  success: boolean;
  reportFile?: FileWithId;
  error?: string;
}> {
  // Validate markdown content
  const contentValidation = validateMarkdownContent(file.content);
  if (!contentValidation.success) {
    return {
      success: false,
      error: contentValidation.error || 'Invalid report content',
    };
  }

  // Generate UUID for report
  const reportId = randomUUID();

  const reportFile: FileWithId = {
    id: reportId,
    name: file.name,
    file_type: 'report',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version_number: 1,
    content: file.content,
  };

  return {
    success: true,
    reportFile,
  };
}

// Create initial version history for a report
function createInitialReportVersionHistory(
  content: string,
  createdAt: string
): Record<string, { content: string; updated_at: string; version_number: number }> {
  return {
    '1': {
      content,
      updated_at: createdAt,
      version_number: 1,
    },
  };
}

// Main create report files function
const createReportFiles = wrapTraced(
  async (
    params: CreateReportFilesParams,
    runtimeContext: RuntimeContext<AnalystRuntimeContext>
  ): Promise<CreateReportFilesOutput> => {
    const startTime = Date.now();

    // Get runtime context values
    const userId = runtimeContext?.get('userId') as string;
    const organizationId = runtimeContext?.get('organizationId') as string;
    const messageId = runtimeContext?.get('messageId') as string | undefined;

    if (!userId) {
      return {
        message: 'Unable to verify your identity. Please log in again.',
        duration: Date.now() - startTime,
        files: [],
        failed_files: [],
      };
    }
    if (!organizationId) {
      return {
        message: 'Unable to access your organization. Please check your permissions.',
        duration: Date.now() - startTime,
        files: [],
        failed_files: [],
      };
    }

    const files: FileWithId[] = [];
    const failedFiles: FailedFileCreation[] = [];

    // Process files concurrently
    const processResults = await Promise.allSettled(
      params.files.map(async (file) => {
        const result = await processReportFile(file);
        return { fileName: file.name, result };
      })
    );

    const successfulProcessing: Array<{
      reportFile: FileWithId;
    }> = [];

    // Separate successful from failed processing
    for (const processResult of processResults) {
      if (processResult.status === 'fulfilled') {
        const { fileName, result } = processResult.value;
        if (result.success && result.reportFile) {
          successfulProcessing.push({
            reportFile: result.reportFile,
          });
        } else {
          failedFiles.push({
            name: fileName,
            error: result.error || 'Unknown error',
          });
        }
      } else {
        failedFiles.push({
          name: 'unknown',
          error: processResult.reason?.message || 'Processing failed',
        });
      }
    }

    // Database operations
    if (successfulProcessing.length > 0) {
      try {
        await db.transaction(async (tx: typeof db) => {
          // Insert report files
          const reportRecords = successfulProcessing.map((sp, index) => {
            const originalFile = params.files[index];
            if (!originalFile) {
              // This should never happen, but handle gracefully
              return {
                id: sp.reportFile.id,
                name: sp.reportFile.name,
                content: sp.reportFile.content || '',
                organizationId,
                createdBy: userId,
                createdAt: sp.reportFile.created_at,
                updatedAt: sp.reportFile.updated_at,
                deletedAt: null,
                publiclyAccessible: false,
                publiclyEnabledBy: null,
                publicExpiryDate: null,
                versionHistory: createInitialReportVersionHistory(
                  sp.reportFile.content || '',
                  sp.reportFile.created_at
                ),
                publicPassword: null,
                workspaceSharing: 'none' as const,
                workspaceSharingEnabledBy: null,
                workspaceSharingEnabledAt: null,
              };
            }
            return {
              id: sp.reportFile.id,
              name: originalFile.name,
              content: sp.reportFile.content || '',
              organizationId,
              createdBy: userId,
              createdAt: sp.reportFile.created_at,
              updatedAt: sp.reportFile.updated_at,
              deletedAt: null,
              publiclyAccessible: false,
              publiclyEnabledBy: null,
              publicExpiryDate: null,
              versionHistory: createInitialReportVersionHistory(
                sp.reportFile.content || '',
                sp.reportFile.created_at
              ),
              publicPassword: null,
              workspaceSharing: 'none' as const,
              workspaceSharingEnabledBy: null,
              workspaceSharingEnabledAt: null,
            };
          });
          await tx.insert(reportFiles).values(reportRecords);

          // Insert asset permissions
          const assetPermissionRecords = reportRecords.map((record) => ({
            identityId: userId,
            identityType: 'user' as const,
            assetId: record.id,
            assetType: 'report_file' as const,
            role: 'owner' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null,
            createdBy: userId,
            updatedBy: userId,
          }));
          await tx.insert(assetPermissions).values(assetPermissionRecords);
        });

        // Add successful files to output
        for (const sp of successfulProcessing) {
          files.push({
            id: sp.reportFile.id,
            name: sp.reportFile.name,
            file_type: sp.reportFile.file_type,
            result_message: sp.reportFile.result_message || '',
            results: sp.reportFile.results || [],
            created_at: sp.reportFile.created_at,
            updated_at: sp.reportFile.updated_at,
            version_number: sp.reportFile.version_number,
          });
        }
      } catch (error) {
        // Add all successful processing to failed if database operation fails
        for (const sp of successfulProcessing) {
          failedFiles.push({
            name: sp.reportFile.name,
            error: `Failed to save to database: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
      }
    }

    // Track file associations if messageId is available
    if (messageId && files.length > 0) {
      await trackFileAssociations({
        messageId,
        files: files.map((file) => ({
          id: file.id,
          version: file.version_number,
        })),
      });
    }

    const duration = Date.now() - startTime;
    const message = generateResultMessage(files, failedFiles);

    return {
      message,
      duration,
      files,
      failed_files: failedFiles,
    };
  },
  { name: 'create-reports-file' }
);

function generateResultMessage(
  createdFiles: FileWithId[],
  failedFiles: FailedFileCreation[]
): string {
  if (failedFiles.length === 0) {
    return `Successfully created ${createdFiles.length} report files.`;
  }

  const successMsg =
    createdFiles.length > 0 ? `Successfully created ${createdFiles.length} report files. ` : '';

  const failures = failedFiles.map(
    (failure) =>
      `Failed to create '${failure.name}': ${failure.error}.\n\nPlease recreate the report from scratch rather than attempting to modify. This error could be due to:\n- Invalid or empty content\n- Content too long (over 100,000 characters)\n- Special characters causing parsing issues\n- Network or database connectivity problems`
  );

  if (failures.length === 1) {
    return `${successMsg.trim()}${failures[0]}.`;
  }

  return `${successMsg}Failed to create ${failures.length} report files:\n${failures.join('\n')}`;
}

// Export the tool with complete schema included
export const createReports = createTool({
  id: 'create-reports-file',
  description: `Creates report files with markdown content. Reports are used to document findings, analysis results, and insights in a structured markdown format. **This tool supports creating multiple reports in a single call; prefer using bulk creation over creating reports one by one.**

## REPORT CONTENT GUIDELINES

Reports should contain well-structured markdown content that follows these best practices:

**Structure:**
- Use clear headings (# ## ###) to organize content
- Include executive summary, key findings, methodology, and conclusions
- Use bullet points and numbered lists for clarity
- Include tables, charts references, and data visualizations where relevant

**Content Requirements:**
- Minimum 10 characters of meaningful content
- Maximum 100,000 characters per report
- Use standard markdown formatting (headers, lists, links, etc.)
- Include data sources and methodology where applicable

**Best Practices:**
- Start with an executive summary
- Use data to support conclusions
- Include actionable recommendations
- Reference specific metrics and timeframes
- Maintain professional tone and clear language

**Example Report Structure:**
\`\`\`markdown
# Sales Performance Analysis - Q4 2024

## Executive Summary
This report analyzes Q4 2024 sales performance across all channels...

## Key Findings
- Total revenue increased by 15% compared to Q3
- Online sales grew 22% while in-store declined 3%
- Customer acquisition cost decreased by 8%

## Methodology
Data was collected from Salesforce CRM and Google Analytics...

## Recommendations
1. Increase investment in digital marketing channels
2. Optimize in-store experience to boost foot traffic
3. Implement customer retention programs

## Conclusion
Overall performance exceeded expectations with strong digital growth...
\`\`\`

**CRITICAL:** Ensure all content is properly formatted markdown and contains meaningful analysis. Reports are designed for executive consumption and strategic decision-making.`,
  inputSchema: z.object({
    files: z
      .array(
        z.object({
          name: z
            .string()
            .describe(
              'The descriptive name/title for the report. This should be a clear, professional title that indicates the report subject and scope. Examples: "Q4 Sales Analysis", "Customer Retention Study", "Marketing Campaign Performance Review"'
            ),
          content: z
            .string()
            .describe(
              'The markdown content for the report. Should be well-structured with headers, sections, and clear analysis. Multiple reports can be created in one call by providing multiple entries in the files array. **Prefer creating reports in bulk.**'
            ),
        })
      )
      .min(1)
      .describe(
        'List of report file parameters to create. Each report should contain comprehensive markdown content with analysis, findings, and recommendations.'
      ),
  }),
  outputSchema: z.object({
    message: z.string(),
    duration: z.number(),
    files: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        file_type: z.string(),
        result_message: z.string().optional(),
        results: z.array(z.record(z.any())).optional(),
        created_at: z.string(),
        updated_at: z.string(),
        version_number: z.number(),
      })
    ),
    failed_files: z.array(
      z.object({
        name: z.string(),
        error: z.string(),
      })
    ),
  }),
  execute: async ({ context, runtimeContext }) => {
    return await createReportFiles(
      context as CreateReportFilesParams,
      runtimeContext as RuntimeContext<AnalystRuntimeContext>
    );
  },
});

export default createReports;
