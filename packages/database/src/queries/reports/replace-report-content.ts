import { and, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { reportFiles } from '../../schema';

// Input validation schema for replacing text within report content
const ReplaceReportContentInputSchema = z.object({
  reportId: z.string().uuid('Report ID must be a valid UUID'),
  findString: z.string().describe('Text to find in the report content'),
  replaceString: z.string().describe('Text to replace the found text with'),
});

type ReplaceReportContentInput = z.infer<typeof ReplaceReportContentInputSchema>;

/**
 * Replaces specific text within a report's content field
 * Uses PostgreSQL's REPLACE function to find and replace text
 * Returns the newly modified content
 */
export const replaceReportContent = async (
  params: ReplaceReportContentInput
): Promise<{ content: string }> => {
  const { reportId, findString, replaceString } = ReplaceReportContentInputSchema.parse(params);

  try {
    // Replace text within report content using PostgreSQL REPLACE function and return the new content
    const result = await db
      .update(reportFiles)
      .set({
        content: sql`REPLACE(${reportFiles.content}, ${findString}, ${replaceString})`,
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
    console.error('Error replacing report content:', {
      reportId,
      error: error instanceof Error ? error.message : error,
    });

    // Re-throw with more context
    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Failed to replace report content');
  }
};
