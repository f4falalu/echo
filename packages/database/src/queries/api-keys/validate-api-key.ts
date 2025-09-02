import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { apiKeys, organizations, users } from '../../schema';

export interface ApiKeyValidation {
  id: string;
  ownerId: string;
  organizationId: string;
  key: string;
}

/**
 * Validates an API key and returns the associated data if valid
 * @param key The API key to validate
 * @returns The API key data if valid, null otherwise
 */
export async function validateApiKey(key: string): Promise<ApiKeyValidation | null> {
  try {
    const result = await db
      .select({
        id: apiKeys.id,
        ownerId: apiKeys.ownerId,
        organizationId: apiKeys.organizationId,
        key: apiKeys.key,
      })
      .from(apiKeys)
      .where(and(eq(apiKeys.key, key), isNull(apiKeys.deletedAt)))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error validating API key:', error);
    return null;
  }
}

/**
 * Gets the organization associated with an API key
 * @param apiKeyId The API key ID
 * @returns The organization data if found, null otherwise
 */
export async function getApiKeyOrganization(apiKeyId: string): Promise<{
  id: string;
  name: string;
  paymentRequired: boolean;
} | null> {
  try {
    const result = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        paymentRequired: organizations.paymentRequired,
      })
      .from(apiKeys)
      .innerJoin(organizations, eq(apiKeys.organizationId, organizations.id))
      .where(and(eq(apiKeys.id, apiKeyId), isNull(apiKeys.deletedAt)))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error getting API key organization:', error);
    return null;
  }
}

/**
 * Gets the owner user of an API key
 * @param apiKeyId The API key ID
 * @returns The user data if found, null otherwise
 */
export async function getApiKeyOwner(apiKeyId: string): Promise<{
  id: string;
  email: string;
  name: string | null;
} | null> {
  try {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
      })
      .from(apiKeys)
      .innerJoin(users, eq(apiKeys.ownerId, users.id))
      .where(and(eq(apiKeys.id, apiKeyId), isNull(apiKeys.deletedAt)))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error getting API key owner:', error);
    return null;
  }
}
