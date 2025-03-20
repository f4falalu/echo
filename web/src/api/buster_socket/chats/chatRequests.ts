import type {
  CreateNewChatParams,
  StopChatParams,
  UnsubscribeFromChatParams,
  DuplicateChatParams
} from '../../request_interfaces/chats';
import type { BusterSocketRequestBase } from '../base_interfaces';

/**
 * Request type for creating a new chat session or continuing an existing one.
 * @interface ChatCreateNewChat
 * @extends BusterSocketRequestBase
 */
export type ChatCreateNewChat = BusterSocketRequestBase<'/chats/post', CreateNewChatParams>;

/**
 * Request type for stopping an active chat or message generation.
 * @interface ChatStopChat
 * @extends BusterSocketRequestBase
 */
export type ChatStopChat = BusterSocketRequestBase<'/chats/stop', StopChatParams>;

/**
 * Request type for unsubscribing from real-time updates of a specific chat.
 * @interface ChatUnsubscribeFromChat
 * @extends BusterSocketRequestBase
 */
export type ChatUnsubscribeFromChat = BusterSocketRequestBase<
  '/chats/unsubscribe',
  UnsubscribeFromChatParams
>;

/**
 * Request type for duplicating an existing chat.
 * @interface ChatsDuplicateChat
 * @extends BusterSocketRequestBase
 */
export type ChatsDuplicateChat = BusterSocketRequestBase<'/chats/duplicate', DuplicateChatParams>;

/**
 * Union type of all possible chat-related request types.
 */
export type ChatEmits =
  | ChatCreateNewChat
  | ChatUnsubscribeFromChat
  | ChatsDuplicateChat
  | ChatStopChat;
