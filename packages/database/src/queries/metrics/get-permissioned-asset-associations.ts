import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import {
  assetPermissions,
  collections,
  collectionsToAssets,
  dashboardFiles,
  metricFilesToDashboardFiles,
} from '../../schema';
import type { AssetType, IdentityType } from '../../schema-types/enums';

export interface AssociatedAsset {
  id: string;
  name: string;
}

export interface AssetsAssociatedWithMetric {
  dashboards: AssociatedAsset[];
  collections: AssociatedAsset[];
}

/**
 * Get all dashboards associated with a metric that the user has permission to view
 */
export async function getDashboardsAssociatedWithMetric(
  metricId: string,
  userId: string
): Promise<AssociatedAsset[]> {
  const dashboardResults = await db
    .select({
      id: dashboardFiles.id,
      name: dashboardFiles.name,
    })
    .from(metricFilesToDashboardFiles)
    .innerJoin(dashboardFiles, eq(metricFilesToDashboardFiles.dashboardFileId, dashboardFiles.id))
    .innerJoin(
      assetPermissions,
      and(
        eq(assetPermissions.assetId, dashboardFiles.id),
        eq(assetPermissions.assetType, 'dashboard_file' as AssetType),
        eq(assetPermissions.identityId, userId),
        eq(assetPermissions.identityType, 'user' as IdentityType),
        isNull(assetPermissions.deletedAt)
      )
    )
    .where(
      and(
        eq(metricFilesToDashboardFiles.metricFileId, metricId),
        isNull(dashboardFiles.deletedAt),
        isNull(metricFilesToDashboardFiles.deletedAt)
      )
    );

  return dashboardResults.map((row) => ({
    id: row.id,
    name: row.name,
  }));
}

/**
 * Get all collections associated with a metric that the user has permission to view
 */
export async function getCollectionsAssociatedWithMetric(
  metricId: string,
  userId: string
): Promise<AssociatedAsset[]> {
  const collectionResults = await db
    .select({
      id: collections.id,
      name: collections.name,
    })
    .from(collectionsToAssets)
    .innerJoin(collections, eq(collectionsToAssets.collectionId, collections.id))
    .innerJoin(
      assetPermissions,
      and(
        eq(assetPermissions.assetId, collections.id),
        eq(assetPermissions.assetType, 'collection' as AssetType),
        eq(assetPermissions.identityId, userId),
        eq(assetPermissions.identityType, 'user' as IdentityType),
        isNull(assetPermissions.deletedAt)
      )
    )
    .where(
      and(
        eq(collectionsToAssets.assetId, metricId),
        eq(collectionsToAssets.assetType, 'metric_file' as AssetType),
        isNull(collections.deletedAt),
        isNull(collectionsToAssets.deletedAt)
      )
    );

  return collectionResults.map((row) => ({
    id: row.id,
    name: row.name,
  }));
}

/**
 * Get all assets (dashboards and collections) associated with a metric
 */
export async function getAssetsAssociatedWithMetric(
  metricId: string,
  userId: string
): Promise<AssetsAssociatedWithMetric> {
  // Run both queries concurrently
  const [dashboards, collections] = await Promise.all([
    getDashboardsAssociatedWithMetric(metricId, userId),
    getCollectionsAssociatedWithMetric(metricId, userId),
  ]);

  return {
    dashboards,
    collections,
  };
}
