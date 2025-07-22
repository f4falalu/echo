import { queue } from '@trigger.dev/sdk';

/**
 * Queue configuration for analyst agent tasks.
 * This queue ensures that only one analyst task runs at a time per chat,
 * while allowing multiple chats to process concurrently.
 *
 * Usage: When triggering analyst-agent-task, use concurrencyKey with the chatId
 * to create separate queue instances for each chat.
 */
export const analystQueue: ReturnType<typeof queue> = queue({
  name: 'analyst-agent-queue',
  concurrencyLimit: 1, // Only 1 task runs at a time per concurrencyKey (chatId)
});
