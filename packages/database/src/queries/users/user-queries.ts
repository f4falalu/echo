import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { users, usersToOrganizations } from '../../schema';
import { UserPersonalizationConfigSchema } from '../../schema-types';
import type { User } from './user';

// Use the full User type from the schema internally
type FullUser = typeof users.$inferSelect;

export const UserInfoByIdResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  email: z.string().email(),
  role: z.string(),
  status: z.string(),
  organizationId: z.string().uuid(),
  personalizationEnabled: z.boolean(),
  personalizationConfig: UserPersonalizationConfigSchema,
});

export const UpdateUserInputSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().optional(),
  personalizationEnabled: z.boolean().optional(),
  personalizationConfig: UserPersonalizationConfigSchema.optional(),
});

export const UpdateUserResponseSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().optional(),
  personalizationEnabled: z.boolean().optional(),
  personalizationConfig: UserPersonalizationConfigSchema.optional(),
  updatedAt: z.string().optional(),
});

export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;
export type UpdateUserResponse = z.infer<typeof UpdateUserResponseSchema>;
export type UserInfoByIdResponse = z.infer<typeof UserInfoByIdResponseSchema>;

/**
 * Converts a full user to the public User type
 */
function toPublicUser(user: Pick<FullUser, 'id' | 'name' | 'email' | 'avatarUrl'>): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
  };
}

/**
 * Finds a user by email address (alternative implementation)
 * @param email The email address to search for
 * @returns The user if found, null otherwise
 */
export async function findUserByEmailAlt(email: string): Promise<User | null> {
  try {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

    const user = result[0];
    return user ? toPublicUser(user) : null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
}

/**
 * Finds a user by email within a specific organization
 * @param email The email address to search for
 * @param organizationId The organization ID to search within
 * @returns The user if found in the organization, null otherwise
 */
export async function findUserByEmailInOrganization(
  email: string,
  organizationId: string
): Promise<User | null> {
  try {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        config: users.config,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        attributes: users.attributes,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .innerJoin(
        usersToOrganizations,
        and(
          eq(users.id, usersToOrganizations.userId),
          eq(usersToOrganizations.organizationId, organizationId),
          isNull(usersToOrganizations.deletedAt)
        )
      )
      .where(eq(users.email, email))
      .limit(1);

    const user = result[0];
    return user ? toPublicUser(user) : null;
  } catch (error) {
    console.error('Error finding user in organization:', error);
    return null;
  }
}

/**
 * Creates a new user
 * @param email The user's email address
 * @param name Optional name for the user
 * @returns The created user
 */
export async function createUser(email: string, name?: string): Promise<User> {
  try {
    const result = await db
      .insert(users)
      .values({
        email,
        name: name || email.split('@')[0], // Use email prefix as default name
        config: {},
        attributes: {},
      })
      .returning();

    const user = result[0];
    if (!user) {
      throw new Error('Failed to create user');
    }

    return toPublicUser(user);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Adds a user to an organization
 * @param userId The user ID
 * @param organizationId The organization ID
 * @param role The user's role in the organization
 */
export async function addUserToOrganization(
  userId: string,
  organizationId: string,
  role:
    | 'workspace_admin'
    | 'data_admin'
    | 'querier'
    | 'restricted_querier'
    | 'viewer' = 'restricted_querier'
) {
  try {
    await db.insert(usersToOrganizations).values({
      userId,
      organizationId,
      role,
      sharingSetting: 'none',
      editSql: false,
      uploadCsv: false,
      exportAssets: false,
      emailSlackEnabled: false,
      createdBy: userId, // Self-created for API users
      updatedBy: userId,
      status: 'active',
    });
  } catch (error) {
    console.error('Error adding user to organization:', error);
    throw error;
  }
}

/**
 * Updates user information
 * @param input The user update parameters
 * @returns The updated user information
 */
export async function updateUser(input: UpdateUserInput): Promise<UpdateUserResponse> {
  const validated = UpdateUserInputSchema.parse(input);

  const updateData: Pick<
    UpdateUserResponse,
    'name' | 'personalizationEnabled' | 'personalizationConfig' | 'updatedAt'
  > = {};

  if (validated.name !== undefined) {
    updateData.name = validated.name;
  }

  if (validated.personalizationEnabled !== undefined) {
    updateData.personalizationEnabled = validated.personalizationEnabled;
  }

  if (validated.personalizationConfig !== undefined) {
    updateData.personalizationConfig = validated.personalizationConfig;
  }

  updateData.updatedAt = new Date().toISOString();

  const result = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, validated.userId))
    .returning();

  if (result.length === 0 || !result[0]) {
    throw new Error(`User not found: ${validated.userId}`);
  }
  const updatedUser = result[0];

  return {
    userId: updatedUser.id,
    name: updatedUser.name || undefined,
    personalizationEnabled: updatedUser.personalizationEnabled,
    personalizationConfig: updatedUser.personalizationConfig,
    updatedAt: updatedUser.updatedAt,
  };
}

/**
 * Get comprehensive user information including datasets and permissions
 * This function replaces the complex Rust implementation with TypeScript
 */
export async function getUserInformation(userId: string): Promise<UserInfoByIdResponse> {
  // Get user basic info and organization relationship
  const userInfo = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      personalizationEnabled: users.personalizationEnabled,
      personalizationConfig: users.personalizationConfig,
      role: usersToOrganizations.role,
      status: usersToOrganizations.status,
      organizationId: usersToOrganizations.organizationId,
    })
    .from(users)
    .innerJoin(usersToOrganizations, eq(users.id, usersToOrganizations.userId))
    .where(and(eq(users.id, userId), isNull(usersToOrganizations.deletedAt)))
    .limit(1);

  if (userInfo.length === 0 || !userInfo[0]) {
    throw new Error(`User not found: ${userId}`);
  }

  const user = UserInfoByIdResponseSchema.parse(userInfo[0]);
  return user;
}
