import type { BusterChatMessageResponse } from '@/api/asset_interfaces/chat';
import type { EventBase } from '../base_interfaces';

/**
 * Chat event interface for title generation process.
 *
 * @remarks
 * This interface extends EventBase to include properties specific to
 * the title generation process in chat events.
 *
 * @public
 */
export type ChatEvent_GeneratingTitle = {
  /** The complete generated title when available */
  title?: string;
  /** A partial chunk of the title during the generation process */
  title_chunk?: string;
} & EventBase;

/**
 * Chat event interface for message generation process.
 *
 * @remarks
 * This interface extends EventBase and handles the message generation process.
 * When new messages are received, they are appended to the response_messages array.
 * If a message with a matching ID already exists, it will be updated instead of
 * creating a duplicate entry.
 *
 * @public
 */
export type ChatEvent_GeneratingMessage = {
  // We will append each incoming message to the response_messages array
  // If the message id is already found in the array, we will update the message with the new data
  // This will happen when we need to "hide" a message
  /** The chat message response containing the generated content */
  message: BusterChatMessageResponse;
} & EventBase;
