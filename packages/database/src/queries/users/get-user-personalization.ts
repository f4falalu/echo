import { and, eq } from 'drizzle-orm';
import { db } from '../../connection';
import { users } from '../../schema';
import type { UserPersonalizationConfigType } from '../../schema-types';

export async function getUserPersonalization(
  userId: string
): Promise<UserPersonalizationConfigType | undefined> {
  const result = await db
    .select({
      personalizationConfig: users.personalizationConfig,
    })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.personalizationEnabled, true)))
    .limit(1);

  if (result.length === 0 || !result[0]) {
    return undefined;
  }

  const user = result[0];
  return user.personalizationConfig;
}
