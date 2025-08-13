import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { dashboardFiles, messagesToFiles, metricFiles, reportFiles } from '../../schema';

export interface MessageFile {
  id: string;
  fileType: 'metric' | 'dashboard' | 'report';
  fileName: string;
  versionNumber: number;
}

/**
 * Get all files associated with a message
 */
export async function getMessageFiles(messageId: string): Promise<MessageFile[]> {
  const files: MessageFile[] = [];

  // Get metric files
  const metricResults = await db
    .select({
      id: metricFiles.id,
      name: metricFiles.name,
      versionNumber: messagesToFiles.versionNumber,
    })
    .from(messagesToFiles)
    .innerJoin(
      metricFiles,
      and(eq(messagesToFiles.fileId, metricFiles.id), isNull(metricFiles.deletedAt))
    )
    .where(
      and(
        eq(messagesToFiles.messageId, messageId),
        isNull(messagesToFiles.deletedAt),
        eq(messagesToFiles.isDuplicate, false)
      )
    );

  for (const metric of metricResults) {
    files.push({
      id: metric.id,
      fileType: 'metric',
      fileName: metric.name,
      versionNumber: metric.versionNumber || 1,
    });
  }

  // Get dashboard files
  const dashboardResults = await db
    .select({
      id: dashboardFiles.id,
      name: dashboardFiles.name,
      versionNumber: messagesToFiles.versionNumber,
    })
    .from(messagesToFiles)
    .innerJoin(
      dashboardFiles,
      and(eq(messagesToFiles.fileId, dashboardFiles.id), isNull(dashboardFiles.deletedAt))
    )
    .where(
      and(
        eq(messagesToFiles.messageId, messageId),
        isNull(messagesToFiles.deletedAt),
        eq(messagesToFiles.isDuplicate, false)
      )
    );

  for (const dashboard of dashboardResults) {
    files.push({
      id: dashboard.id,
      fileType: 'dashboard',
      fileName: dashboard.name,
      versionNumber: dashboard.versionNumber || 1,
    });
  }

  // Get report files
  const reportResults = await db
    .select({
      id: reportFiles.id,
      name: reportFiles.name,
      versionNumber: messagesToFiles.versionNumber,
    })
    .from(messagesToFiles)
    .innerJoin(
      reportFiles,
      and(eq(messagesToFiles.fileId, reportFiles.id), isNull(reportFiles.deletedAt))
    )
    .where(
      and(
        eq(messagesToFiles.messageId, messageId),
        isNull(messagesToFiles.deletedAt),
        eq(messagesToFiles.isDuplicate, false)
      )
    );

  for (const report of reportResults) {
    files.push({
      id: report.id,
      fileType: 'report',
      fileName: report.name,
      versionNumber: report.versionNumber || 1,
    });
  }

  return files;
}