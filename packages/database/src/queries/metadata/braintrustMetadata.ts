import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { organizations, users } from '../../schema';
import { getMessageContext } from '../messages/messageContext';

// Input schema
export const BraintrustMetadataInputSchema = z.object({
  messageId: z.string().uuid('Message ID must be a valid UUID'),
});

// Output schema
export const BraintrustMetadataOutputSchema = z.object({
  userName: z.string().nullable(),
  userId: z.string(),
  organizationName: z.string().nullable(),
  organizationId: z.string(),
  messageId: z.string(),
  chatId: z.string(),
});

export type BraintrustMetadataInput = z.infer<typeof BraintrustMetadataInputSchema>;
export type BraintrustMetadataOutput = z.infer<typeof BraintrustMetadataOutputSchema>;

/**
 * Fetch all metadata needed for Braintrust logging in parallel
 * Optimized for speed with concurrent queries
 */
export async function getBraintrustMetadata(
  input: BraintrustMetadataInput
): Promise<BraintrustMetadataOutput> {
  try {
    // Validate input
    const validatedInput = BraintrustMetadataInputSchema.parse(input);

    // First, get the message context to get userId, chatId, and organizationId
    const messageContext = await getMessageContext({ messageId: validatedInput.messageId });

    // Now fetch user and organization names in parallel
    const [userResult, organizationResult] = await Promise.all([
      // Fetch user name
      db
        .select({
          name: users.name,
        })
        .from(users)
        .where(eq(users.id, messageContext.userId))
        .limit(1),

      // Fetch organization name
      db
        .select({
          name: organizations.name,
        })
        .from(organizations)
        .where(eq(organizations.id, messageContext.organizationId))
        .limit(1),
    ]);

    const userName = userResult[0]?.name || null;
    const organizationName = organizationResult[0]?.name || null;

    const output = {
      userName,
      userId: messageContext.userId,
      organizationName,
      organizationId: messageContext.organizationId,
      messageId: validatedInput.messageId,
      chatId: messageContext.chatId,
    };

    // Validate output
    return BraintrustMetadataOutputSchema.parse(output);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input: ${error.errors.map((e) => e.message).join(', ')}`);
    }
    throw error instanceof Error
      ? error
      : new Error(`Failed to get Braintrust metadata: ${String(error)}`);
  }
}
