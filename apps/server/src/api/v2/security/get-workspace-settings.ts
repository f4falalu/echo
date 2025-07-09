import type { GetWorkspaceSettingsResponse } from '@buster/server-shared/security';
import { 
  type User, 
  db, 
  getUserOrganizationId, 
  organizations, 
  eq, 
  and, 
  isNull 
} from '@buster/database';
import { HTTPException } from 'hono/http-exception';

export async function getWorkspaceSettingsHandler(
  user: User
): Promise<GetWorkspaceSettingsResponse> {
  // Get user's organization
  const userOrg = await getUserOrganizationId(user.id);
  
  if (!userOrg) {
    throw new HTTPException(403, {
      message: 'User is not associated with an organization',
    });
  }

  // Fetch organization settings
  const org = await db
    .select({
      restrictNewUserInvitations: organizations.restrictNewUserInvitations,
      defaultRole: organizations.defaultRole,
    })
    .from(organizations)
    .where(
      and(
        eq(organizations.id, userOrg.organizationId),
        isNull(organizations.deletedAt)
      )
    )
    .limit(1);

  if (!org.length || !org[0]) {
    throw new HTTPException(404, {
      message: 'Organization not found',
    });
  }

  const { restrictNewUserInvitations, defaultRole } = org[0];

  // TODO: Implement default datasets logic
  // For now, return an empty array as a placeholder
  // This will need to be implemented based on your custom logic
  const defaultDatasets: Array<{ id: string; name: string }> = [];

  return {
    restrict_new_user_invitations: restrictNewUserInvitations,
    default_role: defaultRole,
    default_datasets: defaultDatasets,
  };
}