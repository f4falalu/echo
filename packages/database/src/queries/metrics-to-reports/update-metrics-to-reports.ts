import { and, eq, inArray, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { metricFilesToReportFiles, reportFiles } from '../../schema';

// Input validation schema
const UpdateMetricsToReportsInputSchema = z.object({
  reportId: z.string().uuid('Report ID must be a valid UUID'),
  metricIds: z.array(z.string().uuid('Metric ID must be a valid UUID')),
  userId: z.string().uuid().optional(),
});

type UpdateMetricsToReportsInput = z.infer<typeof UpdateMetricsToReportsInputSchema>;

/**
 * Updates the metric_files_to_report_files relationships for a given report.
 * - Creates new relationships for metrics not already linked
 * - Updates updatedAt for existing relationships that should remain
 * - Soft deletes relationships that are no longer needed
 */
export const updateMetricsToReports = async (
  params: UpdateMetricsToReportsInput
): Promise<void> => {
  const { reportId, metricIds, userId } = UpdateMetricsToReportsInputSchema.parse(params);

  try {
    const now = new Date().toISOString();

    await db.transaction(async (tx) => {
      // 1. Get all existing relationships for this report (including soft-deleted ones)
      const existingRelationships = await tx
        .select({
          metricFileId: metricFilesToReportFiles.metricFileId,
          deletedAt: metricFilesToReportFiles.deletedAt,
        })
        .from(metricFilesToReportFiles)
        .where(eq(metricFilesToReportFiles.reportFileId, reportId));

      const existingMetricIds = new Set(existingRelationships.map((rel) => rel.metricFileId));
      const activeExistingMetricIds = new Set(
        existingRelationships.filter((rel) => rel.deletedAt === null).map((rel) => rel.metricFileId)
      );
      const softDeletedMetricIds = new Set(
        existingRelationships.filter((rel) => rel.deletedAt !== null).map((rel) => rel.metricFileId)
      );

      // 2. Determine what actions to take
      const metricsToCreate = metricIds.filter((id) => !existingMetricIds.has(id));
      const metricsToRestore = metricIds.filter((id) => softDeletedMetricIds.has(id));
      const metricsToUpdate = metricIds.filter((id) => activeExistingMetricIds.has(id));
      const metricsToDelete = Array.from(activeExistingMetricIds).filter(
        (id) => !metricIds.includes(id)
      );

      // 3. Create new relationships
      if (metricsToCreate.length > 0) {
        let createdBy = userId;
        if (!userId) {
          const [createdByResponse] = await db
            .select({ id: reportFiles.createdBy })
            .from(reportFiles)
            .where(eq(reportFiles.id, reportId));
          if (createdByResponse?.id) {
            createdBy = createdByResponse.id;
          }
        }

        if (createdBy) {
          const newRelationships = metricsToCreate.map((metricId) => ({
            metricFileId: metricId,
            reportFileId: reportId,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
            createdBy: createdBy,
          }));

          await tx.insert(metricFilesToReportFiles).values(newRelationships);
        } else {
          throw new Error('Could not find user id for reports created by');
        }
      }

      // 4. Restore soft-deleted relationships (undelete and update)
      if (metricsToRestore.length > 0) {
        await tx
          .update(metricFilesToReportFiles)
          .set({
            deletedAt: null,
            updatedAt: now,
          })
          .where(
            and(
              eq(metricFilesToReportFiles.reportFileId, reportId),
              inArray(metricFilesToReportFiles.metricFileId, metricsToRestore)
            )
          );
      }

      // 5. Update existing active relationships
      if (metricsToUpdate.length > 0) {
        await tx
          .update(metricFilesToReportFiles)
          .set({
            updatedAt: now,
          })
          .where(
            and(
              eq(metricFilesToReportFiles.reportFileId, reportId),
              inArray(metricFilesToReportFiles.metricFileId, metricsToUpdate),
              isNull(metricFilesToReportFiles.deletedAt)
            )
          );
      }

      // 6. Soft delete relationships that should no longer exist
      if (metricsToDelete.length > 0) {
        await tx
          .update(metricFilesToReportFiles)
          .set({
            deletedAt: now,
            updatedAt: now,
          })
          .where(
            and(
              eq(metricFilesToReportFiles.reportFileId, reportId),
              inArray(metricFilesToReportFiles.metricFileId, metricsToDelete),
              isNull(metricFilesToReportFiles.deletedAt)
            )
          );
      }
    });
  } catch (error) {
    console.error('Error updating metrics-to-reports relationships:', {
      reportId,
      metricIds: metricIds.length,
      error: error instanceof Error ? error.message : error,
    });

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Failed to update metrics-to-reports relationships');
  }
};
