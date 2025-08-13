import { StatusSchema } from '@buster/server-shared/chats';
import { tool } from 'ai';
import { z } from 'zod';
import { createCreateReportsDelta } from './create-reports-delta';
import { createCreateReportsExecute } from './create-reports-execute';
import { createCreateReportsFinish } from './create-reports-finish';
import { createReportsStart } from './create-reports-start';

export const CREATE_REPORTS_TOOL_NAME = 'createReports';

const CreateReportsInputFileSchema = z.object({
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
});

// Input schema for the create reports tool
const CreateReportsInputSchema = z.object({
  files: z
    .array(CreateReportsInputFileSchema)
    .min(1)
    .describe(
      'List of report file parameters to create. Each report should contain comprehensive markdown content with analysis, findings, and recommendations.'
    ),
});

const CreateReportsOutputFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  version_number: z.number(),
});

const CreateReportsOutputFailedFileSchema = z.object({
  name: z.string(),
  error: z.string(),
});

// Output schema for the create reports tool
const CreateReportsOutputSchema = z.object({
  message: z.string(),
  files: z.array(CreateReportsOutputFileSchema),
  failed_files: z.array(CreateReportsOutputFailedFileSchema),
});

// Context schema for the create reports tool
const CreateReportsContextSchema = z.object({
  userId: z.string().describe('The user ID'),
  chatId: z.string().describe('The chat ID'),
  organizationId: z.string().describe('The organization ID'),
  messageId: z.string().optional().describe('The message ID'),
});

const CreateReportStateFileSchema = z.object({
  id: z.string().uuid(),
  file_name: z.string().optional(),
  file_type: z.string(),
  version_number: z.number(),
  file: z
    .object({
      text: z.string(),
    })
    .optional(),
  status: StatusSchema,
});

const CreateReportsStateSchema = z.object({
  toolCallId: z.string().optional(),
  argsText: z.string().optional(),
  files: z.array(CreateReportStateFileSchema).optional(),
  startTime: z.number().optional(),
});

// Export types
export type CreateReportsInput = z.infer<typeof CreateReportsInputSchema>;
export type CreateReportsOutput = z.infer<typeof CreateReportsOutputSchema>;
export type CreateReportsContext = z.infer<typeof CreateReportsContextSchema>;
export type CreateReportsOutputFile = z.infer<typeof CreateReportsOutputFileSchema>;
export type CreateReportsOutputFailedFile = z.infer<typeof CreateReportsOutputFailedFileSchema>;
export type CreateReportsState = z.infer<typeof CreateReportsStateSchema>;
export type CreateReportStateFile = z.infer<typeof CreateReportStateFileSchema>;

// Report tool description
const REPORT_TOOL_DESCRIPTION = `Creates report files with markdown content. Reports are used to document findings, analysis results, and insights in a structured markdown format. **This tool supports creating multiple reports in a single call; prefer using bulk creation over creating reports one by one.**

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

**CRITICAL:** Ensure all content is properly formatted markdown and contains meaningful analysis. Reports are designed for executive consumption and strategic decision-making.`;

// Factory function that accepts agent context and maps to tool context
export function createCreateReportsTool(context: CreateReportsContext) {
  // Initialize state for streaming
  const state: CreateReportsState = {
    argsText: undefined,
    files: [],
    toolCallId: undefined,
  };

  // Create all functions with the context and state passed
  const execute = createCreateReportsExecute(context, state);
  const onInputStart = createReportsStart(context, state);
  const onInputDelta = createCreateReportsDelta(context, state);
  const onInputAvailable = createCreateReportsFinish(context, state);

  return tool({
    description: REPORT_TOOL_DESCRIPTION,
    inputSchema: CreateReportsInputSchema,
    outputSchema: CreateReportsOutputSchema,
    execute,
    onInputStart,
    onInputDelta,
    onInputAvailable,
  });
}
