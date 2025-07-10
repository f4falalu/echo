import {
  datasets,
  datasetsToPermissionGroups,
  db,
  getUserOrganizationId,
  organizations,
  permissionGroups,
} from '@buster/database';
import { and, eq, isNull } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';

export async function validateUserOrganization(userId: string) {
  const userOrg = await getUserOrganizationId(userId);
  if (!userOrg) {
    throw new HTTPException(403, {
      message: 'User is not associated with an organization',
    });
  }
  return userOrg;
}

export async function fetchOrganization(organizationId: string) {
  const org = await db
    .select()
    .from(organizations)
    .where(and(eq(organizations.id, organizationId), isNull(organizations.deletedAt)))
    .limit(1);

  if (!org.length || !org[0]) {
    throw new HTTPException(404, {
      message: 'Organization not found',
    });
  }

  return org[0];
}

export function checkAdminPermissions(role: string | null): void {
  if (role !== 'workspace_admin' && role !== 'data_admin') {
    throw new HTTPException(403, {
      message: 'Insufficient permissions to manage approved domains',
    });
  }
}

export function checkWorkspaceAdminPermission(role: string | null): void {
  if (role !== 'workspace_admin') {
    throw new HTTPException(403, {
      message: 'Only workspace admins can update workspace settings',
    });
  }
}

export async function fetchDefaultDatasets(organizationId: string) {
  const defaultPermissionGroupName = `default:${organizationId}`;

  try {
    const defaultDatasets = await db
      .select({
        id: datasets.id,
        name: datasets.name,
      })
      .from(datasets)
      .innerJoin(
        datasetsToPermissionGroups,
        and(
          eq(datasets.id, datasetsToPermissionGroups.datasetId),
          isNull(datasetsToPermissionGroups.deletedAt)
        )
      )
      .innerJoin(
        permissionGroups,
        and(
          eq(datasetsToPermissionGroups.permissionGroupId, permissionGroups.id),
          eq(permissionGroups.name, defaultPermissionGroupName),
          eq(permissionGroups.organizationId, organizationId),
          isNull(permissionGroups.deletedAt)
        )
      )
      .where(and(eq(datasets.organizationId, organizationId), isNull(datasets.deletedAt)));

    return defaultDatasets;
  } catch (error) {
    console.error('Error fetching default datasets:', {
      organizationId,
      permissionGroupName: defaultPermissionGroupName,
      error: error instanceof Error ? error.message : error,
    });
    throw new HTTPException(500, {
      message: 'Failed to fetch default datasets',
    });
  }
}

export async function ensureDefaultPermissionGroup(organizationId: string, userId: string) {
  const defaultPermissionGroupName = `default:${organizationId}`;

  try {
    // Check if it exists (including soft deleted ones)
    const existingGroup = await db
      .select()
      .from(permissionGroups)
      .where(
        and(
          eq(permissionGroups.name, defaultPermissionGroupName),
          eq(permissionGroups.organizationId, organizationId)
        )
      )
      .limit(1);

    if (existingGroup.length > 0 && existingGroup[0]) {
      // If it's soft deleted, restore it
      if (existingGroup[0].deletedAt) {
        try {
          await db
            .update(permissionGroups)
            .set({
              deletedAt: null,
              updatedBy: userId,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(permissionGroups.id, existingGroup[0].id));

          console.info('Restored soft-deleted default permission group:', {
            permissionGroupId: existingGroup[0].id,
            organizationId,
          });
        } catch (error) {
          console.error('Error restoring default permission group:', {
            permissionGroupId: existingGroup[0].id,
            organizationId,
            error: error instanceof Error ? error.message : error,
          });
          throw new HTTPException(500, {
            message: 'Failed to restore default permission group',
          });
        }
      }
      return existingGroup[0].id;
    }

    // Create if doesn't exist
    const newGroup = await db
      .insert(permissionGroups)
      .values({
        name: defaultPermissionGroupName,
        organizationId,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    if (!newGroup[0]) {
      console.error('Failed to create default permission group - no data returned:', {
        organizationId,
        userId,
        permissionGroupName: defaultPermissionGroupName,
      });
      throw new HTTPException(500, {
        message: 'Failed to create default permission group',
      });
    }

    console.info('Created new default permission group:', {
      permissionGroupId: newGroup[0].id,
      organizationId,
    });

    return newGroup[0].id;
  } catch (error) {
    // If it's already an HTTPException, re-throw it
    if (error instanceof HTTPException) {
      throw error;
    }

    console.error('Error ensuring default permission group:', {
      organizationId,
      userId,
      permissionGroupName: defaultPermissionGroupName,
      error: error instanceof Error ? error.message : error,
    });
    throw new HTTPException(500, {
      message: 'Failed to ensure default permission group exists',
    });
  }
}

export async function updateDefaultDatasets(
  organizationId: string,
  datasetIds: string[] | 'all',
  userId: string
) {
  try {
    const defaultPermissionGroupId = await ensureDefaultPermissionGroup(organizationId, userId);

    // If 'all', fetch all organization datasets
    let finalDatasetIds = datasetIds;
    if (datasetIds === 'all') {
      try {
        const allDatasets = await db
          .select({ id: datasets.id })
          .from(datasets)
          .where(and(eq(datasets.organizationId, organizationId), isNull(datasets.deletedAt)));
        finalDatasetIds = allDatasets.map((d) => d.id);

        console.info('Fetched all organization datasets for default assignment:', {
          organizationId,
          datasetCount: finalDatasetIds.length,
        });
      } catch (error) {
        console.error('Error fetching all organization datasets:', {
          organizationId,
          error: error instanceof Error ? error.message : error,
        });
        throw new HTTPException(500, {
          message: 'Failed to fetch organization datasets',
        });
      }
    } else {
      // Validate that the provided dataset IDs exist and aren't deleted
      try {
        const validDatasets = await db
          .select({ id: datasets.id })
          .from(datasets)
          .where(and(eq(datasets.organizationId, organizationId), isNull(datasets.deletedAt)));
        const validDatasetIds = new Set(validDatasets.map((d) => d.id));
        const invalidIds = datasetIds.filter((id) => !validDatasetIds.has(id));
        finalDatasetIds = datasetIds.filter((id) => validDatasetIds.has(id));

        if (invalidIds.length > 0) {
          console.warn('Some dataset IDs were invalid or deleted:', {
            organizationId,
            invalidIds,
            requestedIds: datasetIds,
            validIds: finalDatasetIds,
          });
        }
      } catch (error) {
        console.error('Error validating dataset IDs:', {
          organizationId,
          datasetIds,
          error: error instanceof Error ? error.message : error,
        });
        throw new HTTPException(500, {
          message: 'Failed to validate dataset IDs',
        });
      }
    }

    // Start a transaction to update datasets atomically
    await db.transaction(async (tx) => {
      try {
        // First, soft delete all existing associations for this permission group
        await tx
          .update(datasetsToPermissionGroups)
          .set({
            deletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .where(
            and(
              eq(datasetsToPermissionGroups.permissionGroupId, defaultPermissionGroupId),
              isNull(datasetsToPermissionGroups.deletedAt)
            )
          );

        // Add or restore dataset associations using upserts
        if (Array.isArray(finalDatasetIds) && finalDatasetIds.length > 0) {
          const currentTime = new Date().toISOString();

          // Prepare values for batch upsert
          const values = finalDatasetIds.map((datasetId) => ({
            datasetId,
            permissionGroupId: defaultPermissionGroupId,
            createdAt: currentTime,
            updatedAt: currentTime,
            deletedAt: null,
          }));

          // Perform upsert - if the combination of datasetId and permissionGroupId exists,
          // update deletedAt to null and updatedAt to current time
          await tx
            .insert(datasetsToPermissionGroups)
            .values(values)
            .onConflictDoUpdate({
              target: [
                datasetsToPermissionGroups.datasetId,
                datasetsToPermissionGroups.permissionGroupId,
              ],
              set: {
                deletedAt: null,
                updatedAt: currentTime,
              },
            });
        }

        console.info('Successfully updated default datasets:', {
          organizationId,
          permissionGroupId: defaultPermissionGroupId,
          datasetCount: Array.isArray(finalDatasetIds) ? finalDatasetIds.length : 0,
          operation: datasetIds === 'all' ? 'all' : 'specific',
        });
      } catch (error) {
        console.error('Error in dataset update transaction:', {
          organizationId,
          permissionGroupId: defaultPermissionGroupId,
          error: error instanceof Error ? error.message : error,
        });
        throw error; // Re-throw to trigger transaction rollback
      }
    });
  } catch (error) {
    // If it's already an HTTPException, re-throw it
    if (error instanceof HTTPException) {
      throw error;
    }

    console.error('Error updating default datasets:', {
      organizationId,
      userId,
      datasetIds,
      error: error instanceof Error ? error.message : error,
    });
    throw new HTTPException(500, {
      message: 'Failed to update default datasets',
    });
  }
}
