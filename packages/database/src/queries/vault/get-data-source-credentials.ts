import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';

export const GetDataSourceCredentialsInputSchema = z.object({
  dataSourceId: z.string().min(1, 'Data source ID is required'),
});

export type GetDataSourceCredentialsInput = z.infer<typeof GetDataSourceCredentialsInputSchema>;

/**
 * Retrieves decrypted credentials from the vault for a data source
 * @param input - Contains the data source ID to retrieve credentials for
 * @returns The decrypted credentials as a parsed object
 * @throws Error if credentials not found or invalid
 */
export async function getDataSourceCredentials(
  input: GetDataSourceCredentialsInput
): Promise<Record<string, unknown>> {
  const validated = GetDataSourceCredentialsInputSchema.parse(input);

  try {
    // Use the data source ID as the vault secret name
    const secretResult = await db.execute(
      sql`SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ${validated.dataSourceId} LIMIT 1`
    );

    if (!secretResult.length || !secretResult[0]?.decrypted_secret) {
      throw new Error(`No credentials found for data source ID: ${validated.dataSourceId}`);
    }

    const secretString = secretResult[0].decrypted_secret as string;

    // Parse and return the credentials
    try {
      return JSON.parse(secretString);
    } catch (parseError) {
      throw new Error(
        `Failed to parse credentials for data source ID ${validated.dataSourceId}: Invalid JSON format`
      );
    }
  } catch (error) {
    // Re-throw with more context if it's not our error
    if (
      error instanceof Error &&
      !error.message.includes('No credentials found') &&
      !error.message.includes('Failed to parse')
    ) {
      throw new Error(
        `Database error retrieving credentials for data source ID ${validated.dataSourceId}: ${error.message}`
      );
    }
    throw error;
  }
}
