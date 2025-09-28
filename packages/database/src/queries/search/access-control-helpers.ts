import { and, eq, isNull, ne, or } from 'drizzle-orm';
import { db } from '../../connection';
import {
  assetPermissions,
  assetSearchV2,
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

/**
 * Get assets with direct permissions
 */
export function getDirectPermissionedAssets(userId: string, organizationId: string) {
  return db
    .selectDistinct({
      assetId: assetSearchV2.assetId,
    })
    .from(assetSearchV2)
    .innerJoin(
      assetPermissions,
      and(
        eq(assetPermissions.assetId, assetSearchV2.assetId),
        eq(assetPermissions.assetType, assetSearchV2.assetType)
      )
    )
    .where(
      and(
        or(
          and(eq(assetPermissions.identityType, 'user'), eq(assetPermissions.identityId, userId)),
          and(
            eq(assetPermissions.identityType, 'organization'),
            eq(assetPermissions.identityId, organizationId)
          )
        ),
        isNull(assetPermissions.deletedAt),
        isNull(assetSearchV2.deletedAt)
      )
    );
}

/**
 * Get assets with permissions inherited from chats
 */
export function getChatInheritedPermissionedAssets(userId: string, organizationId: string) {
  return db
    .selectDistinct({
      assetId: assetSearchV2.assetId,
    })
    .from(assetSearchV2)
    .innerJoin(
      messagesToFiles,
      and(eq(messagesToFiles.fileId, assetSearchV2.assetId), isNull(messagesToFiles.deletedAt))
    )
    .innerJoin(
      messages,
      and(eq(messages.id, messagesToFiles.messageId), isNull(messages.deletedAt))
    )
    .innerJoin(chats, and(eq(chats.id, messages.chatId), isNull(chats.deletedAt)))
    .innerJoin(
      assetPermissions,
      and(eq(assetPermissions.assetId, messages.chatId), eq(assetPermissions.assetType, 'chat'))
    )
    .where(
      and(
        or(
          and(eq(assetPermissions.identityType, 'user'), eq(assetPermissions.identityId, userId)),
          and(
            eq(assetPermissions.identityType, 'organization'),
            eq(assetPermissions.identityId, organizationId)
          ),
          ne(chats.workspaceSharing, 'none')
        ),
        isNull(assetPermissions.deletedAt),
        isNull(assetSearchV2.deletedAt)
      )
    );
}

/**
 * Get assets with permissions inherited from collections
 */
export function getCollectionInheritedPermissionedAssets(userId: string, organizationId: string) {
  return db
    .selectDistinct({
      assetId: assetSearchV2.assetId,
    })
    .from(assetSearchV2)
    .innerJoin(
      collectionsToAssets,
      and(
        eq(collectionsToAssets.assetId, assetSearchV2.assetId),
        eq(collectionsToAssets.assetType, assetSearchV2.assetType),
        isNull(collectionsToAssets.deletedAt)
      )
    )
    .innerJoin(
      collections,
      and(eq(collections.id, collectionsToAssets.collectionId), isNull(collections.deletedAt))
    )
    .innerJoin(
      assetPermissions,
      and(
        eq(assetPermissions.assetId, collectionsToAssets.collectionId),
        eq(assetPermissions.assetType, 'collection')
      )
    )
    .where(
      and(
        or(
          and(eq(assetPermissions.identityType, 'user'), eq(assetPermissions.identityId, userId)),
          and(
            eq(assetPermissions.identityType, 'organization'),
            eq(assetPermissions.identityId, organizationId)
          ),
          ne(collections.workspaceSharing, 'none')
        ),
        isNull(assetPermissions.deletedAt),
        isNull(assetSearchV2.deletedAt)
      )
    );
}

/**
 * Get assets with permissions inherited from dashboards
 */
export function getDashboardInheritedPermissionedAssets(userId: string, organizationId: string) {
  return db
    .selectDistinct({
      assetId: assetSearchV2.assetId,
    })
    .from(assetSearchV2)
    .innerJoin(
      metricFilesToDashboardFiles,
      and(
        eq(metricFilesToDashboardFiles.metricFileId, assetSearchV2.assetId),
        isNull(metricFilesToDashboardFiles.deletedAt)
      )
    )
    .innerJoin(
      dashboardFiles,
      and(
        eq(dashboardFiles.id, metricFilesToDashboardFiles.dashboardFileId),
        isNull(dashboardFiles.deletedAt)
      )
    )
    .innerJoin(
      assetPermissions,
      and(
        eq(assetPermissions.assetId, dashboardFiles.id),
        eq(assetPermissions.assetType, 'dashboard_file')
      )
    )
    .where(
      and(
        or(
          and(eq(assetPermissions.identityType, 'user'), eq(assetPermissions.identityId, userId)),
          and(
            eq(assetPermissions.identityType, 'organization'),
            eq(assetPermissions.identityId, organizationId)
          ),
          ne(dashboardFiles.workspaceSharing, 'none')
        ),
        isNull(assetPermissions.deletedAt),
        isNull(assetSearchV2.deletedAt),
        eq(assetSearchV2.assetType, 'metric_file')
      )
    );
}

/**
 * Get assets with permissions inherited from reports
 */
export function getReportInheritedPermissionedAssets(userId: string, organizationId: string) {
  return db
    .selectDistinct({
      assetId: assetSearchV2.assetId,
    })
    .from(assetSearchV2)
    .innerJoin(
      metricFilesToReportFiles,
      and(
        eq(metricFilesToReportFiles.metricFileId, assetSearchV2.assetId),
        isNull(metricFilesToReportFiles.deletedAt)
      )
    )
    .innerJoin(
      reportFiles,
      and(eq(reportFiles.id, metricFilesToReportFiles.reportFileId), isNull(reportFiles.deletedAt))
    )
    .innerJoin(
      assetPermissions,
      and(
        eq(assetPermissions.assetId, metricFilesToReportFiles.reportFileId),
        eq(assetPermissions.assetType, 'report_file')
      )
    )
    .where(
      and(
        or(
          and(eq(assetPermissions.identityType, 'user'), eq(assetPermissions.identityId, userId)),
          and(
            eq(assetPermissions.identityType, 'organization'),
            eq(assetPermissions.identityId, organizationId)
          ),
          ne(reportFiles.workspaceSharing, 'none')
        ),
        isNull(assetPermissions.deletedAt),
        isNull(assetSearchV2.deletedAt),
        eq(assetSearchV2.assetType, 'metric_file')
      )
    );
}

/**
 * Union all permission sources to get all assets a user has access to
 */
export function getAllUserAccessibleAssets(userId: string, organizationId: string) {
  const directPermissions = getDirectPermissionedAssets(userId, organizationId);
  const chatInherited = getChatInheritedPermissionedAssets(userId, organizationId);
  const collectionInherited = getCollectionInheritedPermissionedAssets(userId, organizationId);
  const dashboardInherited = getDashboardInheritedPermissionedAssets(userId, organizationId);
  const reportInherited = getReportInheritedPermissionedAssets(userId, organizationId);

  return directPermissions
    .union(chatInherited)
    .union(collectionInherited)
    .union(dashboardInherited)
    .union(reportInherited);
}

/**
 * Create a subquery for permissioned assets that can be used in joins
 */
export function createPermissionedAssetsSubquery(userId: string, organizationId: string) {
  return getAllUserAccessibleAssets(userId, organizationId).as('user_accessible_assets');
}
