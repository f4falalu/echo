import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { reportFiles } from '../../schema';

// Input validation schema for updating report content
const UpdateReportContentInputSchema = z.object({
  reportId: z.string().uuid('Report ID must be a valid UUID'),
  content: z.string().describe('The new content for the report'),
});

type UpdateReportContentInput = z.infer<typeof UpdateReportContentInputSchema>;

/**
 * Updates a report's content field directly
 * Used for streaming updates as content is generated
 */
export const updateReportContent = async (
  params: UpdateReportContentInput
): Promise<void> => {
  const { reportId, content } = UpdateReportContentInputSchema.parse(params);

  try {
    await db
      .update(reportFiles)
      .set({
        content,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(reportFiles.id, reportId), isNull(reportFiles.deletedAt)));
  } catch (error) {
    console.error('Error updating report content:', {
      reportId,
      error: error instanceof Error ? error.message : error,
    });

    // Re-throw with more context
    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Failed to update report content');
  }
};