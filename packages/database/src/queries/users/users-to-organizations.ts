import { type InferSelectModel, and, asc, eq, isNull, like } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { users, usersToOrganizations } from '../../schema';
import { getUserOrganizationId } from '../organizations/organizations';
import { withPaginationMeta } from '../shared-types';

type RawOrganizationUser = InferSelectModel<typeof usersToOrganizations>;
type RawUser = InferSelectModel<typeof users>;

// Input schema for type safety
const GetUserToOrganizationInputSchema = z.object({
  userId: z.string().uuid('User ID must be a valid UUID'),
  page: z.number().optional().default(1),
  page_size: z.number().optional().default(250),
  filters: z
    .object({
      userName: z.string().optional(),
      email: z.string().optional(),
    })
    .optional(),
});

export type GetUserToOrganizationInput = z.infer<typeof GetUserToOrganizationInputSchema>;

export type OrganizationUser = Pick<RawUser, 'id' | 'name' | 'email' | 'avatarUrl'> &
  Pick<RawOrganizationUser, 'role' | 'status'>;

export type GetUserToOrganizationResult = {
  users: OrganizationUser[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
};

export const getUserToOrganization = async ({
  userId,
  page = 1,
  page_size = 250,
  filters,
}: GetUserToOrganizationInput): Promise<GetUserToOrganizationResult> => {
  // Validate input
  const validated = GetUserToOrganizationInputSchema.parse({ userId, page, page_size, filters });

  // Get the user's organization ID
  const userOrg = await getUserOrganizationId(validated.userId);
  if (!userOrg) {
    throw new Error('User not found in any organization');
  }

  // Build filter conditions
  const filterConditions = [];
  if (validated.filters?.userName) {
    filterConditions.push(like(users.name, `%${validated.filters.userName}%`));
  }
  if (validated.filters?.email) {
    filterConditions.push(like(users.email, `%${validated.filters.email}%`));
  }

  // Build the complete where condition
  const whereCondition = and(
    eq(usersToOrganizations.organizationId, userOrg.organizationId),
    isNull(usersToOrganizations.deletedAt),
    ...filterConditions
  );

  // Build the query with dynamic
  const query = db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      role: usersToOrganizations.role,
      status: usersToOrganizations.status,
    })
    .from(users)
    .innerJoin(usersToOrganizations, eq(users.id, usersToOrganizations.userId))
    .where(whereCondition)
    .$dynamic();

  // Use withPaginationMeta to handle pagination and count automatically
  const paginationOptions = {
    query,
    orderBy: asc(users.name), // Order by name for consistent results
    page: validated.page,
    page_size: validated.page_size,
    countFrom: users,
    ...(whereCondition && { countWhere: whereCondition }),
  };

  const result = await withPaginationMeta(paginationOptions);

  // Transform to match expected format
  return {
    users: result.data,
    pagination: result.pagination,
  };
};
