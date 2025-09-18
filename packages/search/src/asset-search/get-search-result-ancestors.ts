import {
  chats,
  collections,
  collectionsToAssets,
  dashboardFiles,
  db,
  messages,
  messagesToFiles,
  metricFilesToDashboardFiles,
  metricFilesToReportFiles,
  reportFiles,
} from '@buster/database';
import { and, eq, isNull } from '@buster/database';
import type { Ancestor, AssetAncestors } from '@buster/server-shared';

/**
 * Traces the ancestors of an asset through its relationships
 * @param assetId - The ID of the asset to trace
 * @param assetType - The type of asset ('message', 'dashboard_file', 'metric_file', 'report_file')
 * @param userId - The user ID making the request
 * @param organizationId - The organization ID for scoping
 * @returns Promise<AssetAncestors> - The complete ancestors tree for the asset
 */
export async function getAssetAncestors(
  assetId: string,
  assetType: string,
  _userId: string,
  _organizationId: string
): Promise<AssetAncestors> {
  // Get chats
  const chatsPromise =
    assetType === 'message' ? getMessageChatAncestor(assetId) : getAssetChatAncestor(assetId);

  // Get collections
  const collectionsPromise = getAssetCollectionAncestor(assetId);

  // Get dashboards
  const dashboardsPromise =
    assetType === 'metric_file' ? getMetricDashboardAncestors(assetId) : Promise.resolve([]);

  // Get Reports
  const reportsPromise =
    assetType === 'metric_file' ? getMetricReportAncestors(assetId) : Promise.resolve([]);

  const [chats, collections, dashboards, reports] = await Promise.all([
    chatsPromise,
    collectionsPromise,
    dashboardsPromise,
    reportsPromise,
  ]);

  return {
    chats,
    collections,
    dashboards,
    reports,
  };
}

/**
 * Get a message's chat ancestor
 */
async function getMessageChatAncestor(messageId: string): Promise<Ancestor[]> {
  return await db
    .select({
      id: chats.id,
      title: chats.title,
    })
    .from(messages)
    .innerJoin(chats, eq(chats.id, messages.chatId))
    .where(and(eq(messages.id, messageId), isNull(messages.deletedAt), isNull(chats.deletedAt)))
    .limit(1);
}

async function getAssetChatAncestor(assetId: string): Promise<Ancestor[]> {
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

async function getAssetCollectionAncestor(assetId: string): Promise<Ancestor[]> {
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
async function getMetricDashboardAncestors(metricId: string): Promise<Ancestor[]> {
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
async function getMetricReportAncestors(metricId: string): Promise<Ancestor[]> {
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
