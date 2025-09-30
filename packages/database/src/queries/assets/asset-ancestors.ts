import { and, eq, isNull, sql } from 'drizzle-orm';
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

/**
 * Get chat ancestors as a subquery
 */
export function getChatAncestorsSubquery(assetId: string) {
  return db
    .select({
      id: chats.id,
      title: chats.title,
      type: sql<string>`'chat'`.as('type'),
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

/**
 * Get collection ancestors as a subquery
 */
export function getCollectionAncestorsSubquery(assetId: string) {
  return db
    .select({
      id: collections.id,
      title: collections.name,
      type: sql<string>`'collection'`.as('type'),
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
 * Get dashboard ancestors as a subquery (for metric files only)
 */
export function getDashboardAncestorsSubquery(metricId: string) {
  return db
    .select({
      id: dashboardFiles.id,
      title: dashboardFiles.name,
      type: sql<string>`'dashboard_file'`.as('type'),
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
 * Get report ancestors as a subquery (for metric files only)
 */
export function getReportAncestorsSubquery(metricId: string) {
  return db
    .select({
      id: reportFiles.id,
      title: reportFiles.name,
      type: sql<string>`'report_file'`.as('type'),
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
 * Get all ancestors for an asset using a single query with UNION
 */
export function getAllAncestorsUnified(assetId: string, assetType: string) {
  const chatAncestors = getChatAncestorsSubquery(assetId);
  const collectionAncestors = getCollectionAncestorsSubquery(assetId);

  let query = chatAncestors.union(collectionAncestors);

  // Only include dashboard and report ancestors for metric files
  if (assetType === 'metric_file') {
    const dashboardAncestors = getDashboardAncestorsSubquery(assetId);
    const reportAncestors = getReportAncestorsSubquery(assetId);
    query = query.union(dashboardAncestors).union(reportAncestors);
  }

  return query;
}

/**
 * Optimized function to get all asset ancestors in a single query
 */
export async function getAssetAncestors(
  assetId: string,
  assetType: string,
  _userId: string,
  _organizationId: string
): Promise<AssetAncestors> {
  const results = await getAllAncestorsUnified(assetId, assetType);

  // Group results by ancestor type
  const ancestors: AssetAncestors = {
    chats: [],
    collections: [],
    dashboards: [],
    reports: [],
  };

  for (const result of results) {
    const ancestor: Ancestor = {
      id: result.id,
      title: result.title,
    };

    switch (result.type) {
      case 'chat':
        ancestors.chats.push(ancestor);
        break;
      case 'collection':
        ancestors.collections.push(ancestor);
        break;
      case 'dashboard_file':
        ancestors.dashboards.push(ancestor);
        break;
      case 'report_file':
        ancestors.reports.push(ancestor);
        break;
    }
  }

  return ancestors;
}

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
