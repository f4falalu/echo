import { and, eq, isNull, like } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { users, usersToOrganizations } from '../../schema';
import { getUserOrganizationId } from '../organizations/organizations';

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

// Output schema for type safety
export const UserOutputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  email: z.string(),
  avatarUrl: z.string().nullable(),
  role: z.string(),
  status: z.string(),
});

export type UserWithRole = z.infer<typeof UserOutputSchema>;

export const getUserToOrganization = async ({
  userId,
  filters,
}: GetUserToOrganizationInput): Promise<UserWithRole[]> => {
  // Validate input
  const validated = GetUserToOrganizationInputSchema.parse({ userId, filters });

  try {
    // First, get the user's organization ID using the existing function
    const userOrg = await getUserOrganizationId(validated.userId);

    if (!userOrg) {
      throw new Error('User not found in any organization');
    }

    const organizationId = userOrg.organizationId;

    // Build the where conditions for the join
    const joinConditions = and(
      eq(users.id, usersToOrganizations.userId),
      eq(usersToOrganizations.organizationId, organizationId),
      isNull(usersToOrganizations.deletedAt)
    );

    // Build the where conditions for filtering
    const conditions = [];
    if (validated.filters?.userName) {
      conditions.push(like(users.name, `%${validated.filters.userName}%`));
    }
    if (validated.filters?.email) {
      conditions.push(like(users.email, `%${validated.filters.email}%`));
    }

    const baseQuery = db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
        role: usersToOrganizations.role,
        status: usersToOrganizations.status,
      })
      .from(users)
      .innerJoin(usersToOrganizations, joinConditions);

    const results =
      conditions.length > 0
        ? await baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
        : await baseQuery;

    // Validate and return results
    return results.map((user) => UserOutputSchema.parse(user));
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input: ${error.errors.map((e) => e.message).join(', ')}`);
    }
    throw error;
  }
};
