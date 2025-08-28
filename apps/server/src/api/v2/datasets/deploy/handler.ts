import { type User, db, getUserOrganizationsByUserId } from '@buster/database';
import type { DeployRequest, DeployResponse } from '@buster/server-shared';
import { canUserDeployDatasets, getPermissionError } from './check-permissions';
import { deployModels } from './deploy-models';

/**
 * Handler for deploying datasets
 * Validates permissions and orchestrates deployment
 */
export async function deployDatasetsHandler(
  request: DeployRequest,
  user: User
): Promise<DeployResponse> {
  // Get user organization info
  const userOrgs = await getUserOrganizationsByUserId(user.id);
  if (!userOrgs || userOrgs.length === 0) {
    throw new Error('User has no organization');
  }

  // Use the first organization (most users only have one)
  const userOrg = userOrgs[0];
  if (!userOrg) {
    throw new Error('User has no organization');
  }

  // Check permissions
  if (!canUserDeployDatasets(userOrg.role)) {
    throw new Error(getPermissionError());
  }

  // Deploy models
  return deployModels(request, user.id, userOrg.organizationId, db);
}
