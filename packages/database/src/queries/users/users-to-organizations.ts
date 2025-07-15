import { type InferSelectModel, and, eq, isNull, like } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { users, usersToOrganizations } from '../../schema';
import { getUserOrganizationId } from '../organizations/organizations';

type RawOrganizationUser = InferSelectModel<typeof usersToOrganizations>;
type RawUser = InferSelectModel<typeof users>;

// Input schema for type safety
const GetUserToOrganizationInputSchema = z.object({
  userId: z.string().uuid('User ID must be a valid UUID'),
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

export const getUserToOrganization = async ({
  userId,
  filters,
}: GetUserToOrganizationInput): Promise<OrganizationUser[]> => {
  // Validate input
  const validated = GetUserToOrganizationInputSchema.parse({ userId, filters });

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

  // Execute the query
  const results = await db
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
    .where(whereCondition);

  // Validate and return results
  return results;
};
