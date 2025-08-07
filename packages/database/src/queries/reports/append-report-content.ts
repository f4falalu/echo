import { and, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { reportFiles } from '../../schema';

// Input validation schema for appending to report content
const AppendReportContentInputSchema = z.object({
  reportId: z.string().uuid('Report ID must be a valid UUID'),
  content: z.string().describe('Text to append to the report content'),
});

type AppendReportContentInput = z.infer<typeof AppendReportContentInputSchema>;

/**
 * Appends content to an existing report's content field
 * Uses PostgreSQL's concatenation operator for efficient appending
 * Returns the newly modified content
 */
export const appendReportContent = async (
  params: AppendReportContentInput
): Promise<{ content: string }> => {
  const { reportId, content } = AppendReportContentInputSchema.parse(params);

  try {
    // Append to report content using PostgreSQL concatenation and return the new content
    const result = await db
      .update(reportFiles)
      .set({
        content: sql`${reportFiles.content} || ${content}`,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(reportFiles.id, reportId), isNull(reportFiles.deletedAt)))
      .returning({ content: reportFiles.content });

    const updatedReport = result[0];
    if (!updatedReport) {
      throw new Error('Report not found or already deleted');
    }

    return { content: updatedReport.content };
  } catch (error) {
    console.error('Error appending to report content:', {
      reportId,
      error: error instanceof Error ? error.message : error,
    });

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Failed to append to report content');
  }
};
