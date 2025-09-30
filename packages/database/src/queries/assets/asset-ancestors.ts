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
import type { Ancestor, AssetAncestors } from '../../schema-types';

// Type for database transaction
type DatabaseTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function getAssetChatAncestors(
  assetId: string,
  tx?: DatabaseTransaction
): Promise<Ancestor[]> {
  const dbClient = tx || db;
  return await dbClient
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

export async function getAssetCollectionAncestors(
  assetId: string,
  tx?: DatabaseTransaction
): Promise<Ancestor[]> {
  const dbClient = tx || db;
  return await dbClient
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
export async function getMetricDashboardAncestors(
  metricId: string,
  tx?: DatabaseTransaction
): Promise<Ancestor[]> {
  const dbClient = tx || db;
  return await dbClient
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
export async function getMetricReportAncestors(
  metricId: string,
  tx?: DatabaseTransaction
): Promise<Ancestor[]> {
  const dbClient = tx || db;
  return await dbClient
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

/**
 * Traces the ancestors of an asset through its relationships
 * @param assetId - The ID of the asset to trace
 * @param assetType - The type of asset ('message', 'dashboard_file', 'metric_file', 'report_file')
 * @param userId - The user ID making the request
 * @param organizationId - The organization ID for scoping
 * @param tx - Optional database transaction to use for all queries
 * @returns Promise<AssetAncestors> - The complete ancestors tree for the asset
 */
export async function getAssetAncestorsWithTransaction(
  assetId: string,
  assetType: string,
  _userId: string,
  _organizationId: string
): Promise<AssetAncestors> {
  const results = await db.transaction(async (tx) => {
    // Get chats
    const chatsPromise = getAssetChatAncestors(assetId, tx);

    // Get collections
    const collectionsPromise = getAssetCollectionAncestors(assetId, tx);

    // Get dashboards
    const dashboardsPromise =
      assetType === 'metric_file' ? getMetricDashboardAncestors(assetId, tx) : Promise.resolve([]);

    // Get Reports
    const reportsPromise =
      assetType === 'metric_file' ? getMetricReportAncestors(assetId, tx) : Promise.resolve([]);

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
  });

  return results;
}
export async function getAssetAncestors(
  assetId: string,
  assetType: string,
  _userId: string,
  _organizationId: string
): Promise<AssetAncestors> {
  // Get chats
  const chatsPromise = getAssetChatAncestors(assetId);

  // Get collections
  const collectionsPromise = getAssetCollectionAncestors(assetId);

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
