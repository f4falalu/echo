import type { ChatWithMessages } from '@buster/server-shared/chats';
import type { User } from '@buster/database';
import { eq, and, isNull, isNotNull } from '@buster/database';
import { db, messages } from '@buster/database';
import { HTTPException } from 'hono/http-exception';

export async function cancelChatHandler(
  chatId: string,
  user: User
): Promise<ChatWithMessages> {
  // Query for messages with the given chat_id where is_completed: false and trigger_run_id is not null
  const incompleteTriggerMessages = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.chatId, chatId),
        eq(messages.isCompleted, false),
        isNotNull(messages.triggerRunId)
      )
    );

  // TODO: Implement trigger cancellation logic here
  // For each message with a trigger_run_id, cancel the corresponding trigger run
  // Example (to be implemented):
  // for (const message of incompleteTriggerMessages) {
  //   if (message.triggerRunId) {
  //     await cancelTriggerRun(message.triggerRunId);
  //   }
  // }

  // After cancellation, return the chat object with messages
  // This should match the format returned by get chat and post chat endpoints
  // TODO: Fetch the full chat object with all messages in the same format as get_chat_handler
  // For now, this is a stub that needs to be implemented
  
  throw new HTTPException(501, {
    message: 'Cancel chat endpoint not fully implemented - needs to return ChatWithMessages format',
  });
}