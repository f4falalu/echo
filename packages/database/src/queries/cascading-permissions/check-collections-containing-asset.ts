import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { collections, collectionsToAssets } from '../../schema';
import type { AssetType, WorkspaceSharing } from '../../schema-types';

export interface CollectionWithSharing {
  id: string;
  organizationId: string;
  workspaceSharing: WorkspaceSharing | null;
}

export async function checkCollectionsContainingAsset(
  assetId: string,
  assetType: Extract<AssetType, 'metric_file' | 'dashboard_file' | 'chat' | 'report_file'>
): Promise<CollectionWithSharing[]> {
  // The asset type parameter already matches the AssetType enum values

  const result = await db
    .select({
      id: collections.id,
      organizationId: collections.organizationId,
      workspaceSharing: collections.workspaceSharing,
    })
    .from(collectionsToAssets)
    .innerJoin(collections, eq(collections.id, collectionsToAssets.collectionId))
    .where(
      and(
        eq(collectionsToAssets.assetId, assetId),
        eq(collectionsToAssets.assetType, assetType),
        isNull(collectionsToAssets.deletedAt),
        isNull(collections.deletedAt)
      )
    );

  return result;
}
