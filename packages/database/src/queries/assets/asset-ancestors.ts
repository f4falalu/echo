import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import {
  chats,
  collections,
  collectionsToAssets,
  dashboardFiles,
  messages,
  messagesToFiles,
  metricFilesToDashboardFiles,
  metricFilesToReportFiles,
  reportFiles,
} from '../../schema';
import type { Ancestor } from '../../schema-types';

export async function getAssetChatAncestors(assetId: string): Promise<Ancestor[]> {
  return await db
    .select({
      id: chats.id,
      title: chats.title,
    })
    .from(messagesToFiles)
    .innerJoin(messages, eq(messages.id, messagesToFiles.messageId))
    .innerJoin(chats, eq(chats.id, messages.chatId))
    .where(
      and(
        eq(messagesToFiles.fileId, assetId),
        isNull(messagesToFiles.deletedAt),
        isNull(messages.deletedAt),
        isNull(chats.deletedAt)
      )
    );
}

export async function getAssetCollectionAncestors(assetId: string): Promise<Ancestor[]> {
  return await db
    .select({
      id: collections.id,
      title: collections.name,
    })
    .from(collectionsToAssets)
    .innerJoin(collections, eq(collections.id, collectionsToAssets.collectionId))
    .where(
      and(
        eq(collectionsToAssets.assetId, assetId),
        isNull(collectionsToAssets.deletedAt),
        isNull(collections.deletedAt)
      )
    );
}
/**
 * Get ancestors for a dashboard - find dashboards that contain this metric
 */
export async function getMetricDashboardAncestors(metricId: string): Promise<Ancestor[]> {
  return await db
    .select({
      id: dashboardFiles.id,
      title: dashboardFiles.name,
    })
    .from(metricFilesToDashboardFiles)
    .innerJoin(dashboardFiles, eq(dashboardFiles.id, metricFilesToDashboardFiles.dashboardFileId))
    .where(
      and(
        eq(metricFilesToDashboardFiles.metricFileId, metricId),
        isNull(metricFilesToDashboardFiles.deletedAt),
        isNull(dashboardFiles.deletedAt)
      )
    );
}

/**
 * Get ancestors for a Report - find reports that contain this metric
 */
export async function getMetricReportAncestors(metricId: string): Promise<Ancestor[]> {
  return await db
    .select({
      id: reportFiles.id,
      title: reportFiles.name,
    })
    .from(metricFilesToReportFiles)
    .innerJoin(reportFiles, eq(reportFiles.id, metricFilesToReportFiles.reportFileId))
    .where(
      and(
        eq(metricFilesToReportFiles.metricFileId, metricId),
        isNull(metricFilesToReportFiles.deletedAt),
        isNull(reportFiles.deletedAt)
      )
    );
}
