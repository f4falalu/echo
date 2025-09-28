import {
  getAssetChatAncestors,
  getAssetCollectionAncestors,
  getMetricDashboardAncestors,
  getMetricReportAncestors,
} from '@buster/database/queries';
import type { AssetAncestors, AssetType } from '@buster/server-shared';

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
  assetType: AssetType,
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
