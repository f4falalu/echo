import { type InferSelectModel, and, asc, count, eq, isNull, like } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { users, usersToOrganizations } from '../../schema';
import { getUserOrganizationId } from '../organizations/organizations';
import {
  type PaginatedResponse,
  buildPaginationQueries,
  withPaginationMeta,
} from '../shared-types';

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

export type GetUserToOrganizationResult = PaginatedResponse<OrganizationUser>;

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

  // Build the complete where condition
  const whereCondition = and(
    eq(usersToOrganizations.organizationId, userOrg.organizationId),
    isNull(usersToOrganizations.deletedAt),
    validated.filters?.userName ? like(users.name, `%${validated.filters.userName}%`) : undefined,
    validated.filters?.email ? like(users.email, `%${validated.filters.email}%`) : undefined
  );

  try {
    // Use the new composable approach to build matching queries
    const { dataQuery, buildCountQuery } = buildPaginationQueries({
      select: {
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
        role: usersToOrganizations.role,
        status: usersToOrganizations.status,
      },
      from: users,
      joins: [
        {
          type: 'inner',
          table: usersToOrganizations,
          on: eq(users.id, usersToOrganizations.userId),
        },
      ],
      ...(whereCondition && { where: whereCondition }),
    });

    // Use withPaginationMeta to handle pagination and counting
    const result = await withPaginationMeta({
      query: dataQuery,
      buildCountQuery,
      orderBy: asc(users.name),
      page: validated.page,
      page_size: validated.page_size,
    });

    // Return the result directly - it already has the correct format
    return result;
  } catch (error) {
    console.error(error);
    throw new Error('Error fetching users');
  }
};
