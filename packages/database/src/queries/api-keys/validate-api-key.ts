import { and, eq, isNull } from 'drizzle-orm';
import { getDb } from '../../connection';
import { apiKeys } from '../../schema';

/**
 * Validates an API key by checking if it exists in the database
 * and is not soft-deleted
 * @param apiKey - The API key string to validate
 * @returns Promise<boolean> - true if the API key is valid, false otherwise
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  const db = getDb();

  try {
    const result = await db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .where(and(eq(apiKeys.key, apiKey), isNull(apiKeys.deletedAt)))
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error('Error validating API key:', error);
    return false;
  }
}

/**
 * Gets the API key details if it exists and is not soft-deleted
 * @param apiKey - The API key string to validate
 * @returns Promise<{id: string; organizationId: string; ownerId: string} | null>
 */
export async function getApiKeyDetails(apiKey: string): Promise<{
  id: string;
  organizationId: string;
  ownerId: string;
} | null> {
  const db = getDb();

  try {
    const result = await db
      .select({
        id: apiKeys.id,
        organizationId: apiKeys.organizationId,
        ownerId: apiKeys.ownerId,
      })
      .from(apiKeys)
      .where(and(eq(apiKeys.key, apiKey), isNull(apiKeys.deletedAt)))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error getting API key details:', error);
    return null;
  }
}
