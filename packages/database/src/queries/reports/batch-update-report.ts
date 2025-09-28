import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { reportFiles } from '../../schema';

// Input validation schema for batch updating report
const BatchUpdateReportInputSchema = z.object({
  reportId: z.string().uuid('Report ID must be a valid UUID'),
  content: z.string().describe('The final content after all edits'),
  name: z.string().optional().describe('Optional new name for the report'),
  versionHistory: z
    .record(
      z.string(),
      z.object({
        content: z.string(),
        updated_at: z.string(),
        version_number: z.number(),
      })
    )
    .optional()
    .describe('Updated version history'),
});

type BatchUpdateReportInput = z.infer<typeof BatchUpdateReportInputSchema>;

type VersionHistoryEntry = {
  content: string;
  updated_at: string;
  version_number: number;
};

type VersionHistory = Record<string, VersionHistoryEntry>;

// Simple in-memory queue for each reportId
const updateQueues = new Map<string, Promise<void>>();

/**
 * Wait for all pending updates for a given reportId to complete.
 * This ensures all queued updates are flushed to the database before proceeding.
 */
export async function waitForPendingReportUpdates(reportId: string): Promise<void> {
  const pendingQueue = updateQueues.get(reportId);
  if (pendingQueue) {
    await pendingQueue;
  }
}

/**
 * Internal function that performs the actual update logic.
 * This is separated so it can be queued.
 */
async function performUpdate(params: BatchUpdateReportInput): Promise<void> {
  const { reportId, content, name, versionHistory } = BatchUpdateReportInputSchema.parse(params);

  try {
    const updateData: {
      content: string;
      updatedAt: string;
      name?: string;
      versionHistory?: VersionHistory;
    } = {
      content,
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) {
      updateData.name = name;
    }

    if (versionHistory !== undefined) {
      updateData.versionHistory = versionHistory;
    }

    await db
      .update(reportFiles)
      .set(updateData)
      .where(and(eq(reportFiles.id, reportId), isNull(reportFiles.deletedAt)));
  } catch (error) {
    console.error('Error updating report with version:', {
      reportId,
      error: error instanceof Error ? error.message : error,
    });

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Failed to update report with version');
  }
}

/**
 * Updates a report's content, name, and version history in a single operation.
 * Updates are queued per reportId to ensure they execute in order.
 */
export const updateReportWithVersion = async (params: BatchUpdateReportInput): Promise<void> => {
  const { reportId } = params;

  // Get the current promise for this reportId, or use a resolved promise as the starting point
  const currentQueue = updateQueues.get(reportId) ?? Promise.resolve();

  // Chain the new update to run after the current queue completes
  const newQueue = currentQueue
    .then(() => performUpdate(params))
    .catch(() => performUpdate(params)); // Still try to run even if previous failed

  // Update the queue for this reportId
  updateQueues.set(reportId, newQueue);

  // Clean up the queue entry once this update completes
  newQueue.finally(() => {
    // Only remove if this is still the current queue
    if (updateQueues.get(reportId) === newQueue) {
      updateQueues.delete(reportId);
    }
  });

  return newQueue;
};
