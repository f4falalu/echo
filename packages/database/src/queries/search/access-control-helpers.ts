import { and, eq, isNull, or } from 'drizzle-orm';
import { db } from '../../connection';
import {
  assetPermissions,
  collectionsToAssets,
  dashboardFiles,
  messages,
  messagesToFiles,
  metricFilesToDashboardFiles,
  metricFilesToReportFiles,
  textSearch,
} from '../../schema';

/**
 * Get assets with direct permissions
 */
export function getDirectPermissionedAssets(userId: string, organizationId: string) {
  return db
    .selectDistinct({
      assetId: textSearch.assetId,
    })
    .from(textSearch)
    .innerJoin(
      assetPermissions,
      and(
        eq(assetPermissions.assetId, textSearch.assetId),
        eq(assetPermissions.assetType, textSearch.assetType)
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
        isNull(textSearch.deletedAt)
      )
    );
}

/**
 * Get assets with permissions inherited from chats
 */
export function getChatInheritedPermissionedAssets(userId: string, organizationId: string) {
  return db
    .selectDistinct({
      assetId: textSearch.assetId,
    })
    .from(textSearch)
    .innerJoin(
      messagesToFiles,
      and(eq(messagesToFiles.fileId, textSearch.assetId), isNull(messagesToFiles.deletedAt))
    )
    .innerJoin(
      messages,
      and(eq(messages.id, messagesToFiles.messageId), isNull(messages.deletedAt))
    )
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
          )
        ),
        isNull(assetPermissions.deletedAt),
        isNull(textSearch.deletedAt)
      )
    );
}

/**
 * Get assets with permissions inherited from collections
 */
export function getCollectionInheritedPermissionedAssets(userId: string, organizationId: string) {
  return db
    .selectDistinct({
      assetId: textSearch.assetId,
    })
    .from(textSearch)
    .innerJoin(
      collectionsToAssets,
      and(
        eq(collectionsToAssets.assetId, textSearch.assetId),
        eq(collectionsToAssets.assetType, textSearch.assetType),
        isNull(collectionsToAssets.deletedAt)
      )
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
          )
        ),
        isNull(assetPermissions.deletedAt),
        isNull(textSearch.deletedAt)
      )
    );
}

/**
 * Get assets with permissions inherited from dashboards
 */
export function getDashboardInheritedPermissionedAssets(userId: string, organizationId: string) {
  return db
    .selectDistinct({
      assetId: textSearch.assetId,
    })
    .from(textSearch)
    .innerJoin(
      metricFilesToDashboardFiles,
      and(
        eq(metricFilesToDashboardFiles.metricFileId, textSearch.assetId),
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
          )
        ),
        isNull(assetPermissions.deletedAt),
        isNull(textSearch.deletedAt),
        eq(textSearch.assetType, 'metric_file')
      )
    );
}

/**
 * Get assets with permissions inherited from reports
 */
export function getReportInheritedPermissionedAssets(userId: string, organizationId: string) {
  return db
    .selectDistinct({
      assetId: textSearch.assetId,
    })
    .from(textSearch)
    .innerJoin(
      metricFilesToReportFiles,
      and(
        eq(metricFilesToReportFiles.metricFileId, textSearch.assetId),
        isNull(metricFilesToReportFiles.deletedAt)
      )
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
          )
        ),
        isNull(assetPermissions.deletedAt),
        isNull(textSearch.deletedAt),
        eq(textSearch.assetType, 'metric_file')
      )
    );
}

/**
 * Get messages with permissions inherited from their parent chats
 */
export function getMessagePermissionedAssets(userId: string, organizationId: string) {
  return db
    .selectDistinct({
      assetId: textSearch.assetId,
    })
    .from(textSearch)
    .innerJoin(messages, eq(messages.id, textSearch.assetId))
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
          )
        ),
        isNull(assetPermissions.deletedAt),
        isNull(textSearch.deletedAt),
        eq(textSearch.assetType, 'message')
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
  const messagePermissions = getMessagePermissionedAssets(userId, organizationId);
  const reportInherited = getReportInheritedPermissionedAssets(userId, organizationId);

  return directPermissions
    .union(chatInherited)
    .union(collectionInherited)
    .union(dashboardInherited)
    .union(messagePermissions)
    .union(reportInherited);
}

/**
 * Create a subquery for permissioned assets that can be used in joins
 */
export function createPermissionedAssetsSubquery(userId: string, organizationId: string) {
  return getAllUserAccessibleAssets(userId, organizationId).as('user_accessible_assets');
}
