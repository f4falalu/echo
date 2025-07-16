import { type InferSelectModel, SQL, and, asc, count, eq, isNull, like } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { db } from '../../connection';
import { users, usersToOrganizations } from '../../schema';
import { getUserOrganizationId } from '../organizations/organizations';
import { type PaginatedResponse, createPaginatedResponse } from '../shared-types';
import { withPagination } from '../shared-types/with-pagination';

type RawOrganizationUser = InferSelectModel<typeof usersToOrganizations>;
type RawUser = InferSelectModel<typeof users>;

// Input schema for type safety
const GetUserToOrganizationInputSchema = z.object({
  userId: z.string().uuid('User ID must be a valid UUID'),
  page: z.number().optional().default(1),
  page_size: z.number().optional().default(250),
  user_name: z.string().optional(),
  email: z.string().optional(),
});

type GetUserToOrganizationInput = z.infer<typeof GetUserToOrganizationInputSchema>;

type OrganizationUser = Pick<RawUser, 'id' | 'name' | 'email' | 'avatarUrl'> &
  Pick<RawOrganizationUser, 'role' | 'status'>;

// Helper function to build the WHERE condition for user organization queries
function buildUserOrgWhereCondition(
  organizationId: string,
  filters?: Pick<GetUserToOrganizationInput, 'user_name' | 'email'>
) {
  return and(
    eq(usersToOrganizations.organizationId, organizationId),
    isNull(usersToOrganizations.deletedAt),
    filters?.user_name ? like(users.name, `%${filters.user_name}%`) : undefined,
    filters?.email ? like(users.email, `%${filters.email}%`) : undefined
  );
}

// Helper function to build the base query with joins
function buildUserOrgBaseQuery<T extends Record<string, PgColumn | SQL>>(selectColumns: T) {
  return db
    .select(selectColumns)
    .from(users)
    .innerJoin(usersToOrganizations, eq(users.id, usersToOrganizations.userId));
}

// Helper function to get the total count of users in an organization
async function getUserToOrganizationTotal(
  organizationId: string,
  filters?: Pick<GetUserToOrganizationInput, 'user_name' | 'email'>
): Promise<number> {
  try {
    const query = buildUserOrgBaseQuery({ count: count() }).where(
      buildUserOrgWhereCondition(organizationId, filters)
    );
    const result = await query;
    return result[0]?.count ?? 0;
  } catch (error) {
    console.error(error);
    return 0;
  }
}

export const getUserToOrganization = async (
  params: GetUserToOrganizationInput
): Promise<PaginatedResponse<OrganizationUser>> => {
  // Validate input
  const { user_name, email, page, page_size, userId } =
    GetUserToOrganizationInputSchema.parse(params);
  const filters = {
    user_name,
    email,
  };
  // Get the user's organization ID
  const { organizationId } = await getUserOrganizationId(userId)
    .then((userOrg) => {
      if (!userOrg || !userOrg.organizationId) {
        throw new Error('User not found in any organization');
      }
      return { organizationId: userOrg.organizationId };
    })
    .catch((error) => {
      console.error(error);
      throw new Error('Error fetching user organization');
    });

  try {
    // Build and execute the data query using shared helpers
    const dataQuery = withPagination(
      buildUserOrgBaseQuery({
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
        role: usersToOrganizations.role,
        status: usersToOrganizations.status,
      })
        .where(buildUserOrgWhereCondition(organizationId, filters))
        .$dynamic(),
      asc(users.name),
      page,
      page_size
    );

    // Execute queries in parallel for better performance
    const [data, total] = await Promise.all([
      dataQuery,
      getUserToOrganizationTotal(organizationId, filters),
    ]);

    // Use the simple createPaginatedResponse helper
    return createPaginatedResponse({
      data,
      page,
      page_size,
      total,
    });
  } catch (error) {
    console.error(error);
    throw new Error('Error fetching users');
  }
};
