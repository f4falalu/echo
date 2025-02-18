import type {
  GetChatParams,
  GetChatListParams,
  CreateNewChatParams,
  StopChatParams,
  UnsubscribeFromChatParams,
  DeleteChatParams,
  UpdateChatParams,
  ChatsSearchParams,
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
 * Request type for retrieving a specific chat by its ID.
 * @interface ChatGetChat
 * @extends BusterSocketRequestBase
 */
export type ChatGetChat = BusterSocketRequestBase<'/chats/get', GetChatParams>;

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
 * Request type for retrieving a paginated list of chats.
 * @interface ChatListEmitPayload
 * @extends BusterSocketRequestBase
 */
export type ChatListEmitPayload = BusterSocketRequestBase<'/chats/list', GetChatListParams>;

/**
 * Request type for deleting a specific chat.
 * @interface ChatDeleteChat
 * @extends BusterSocketRequestBase
 */
export type ChatDeleteChat = BusterSocketRequestBase<'/chats/delete', DeleteChatParams[]>;

/**
 * Request type for updating chat properties.
 * @interface ChatUpdateChat
 * @extends BusterSocketRequestBase
 */
export type ChatUpdateChat = BusterSocketRequestBase<'/chats/update', UpdateChatParams>;

/**
 * Request type for searching through chats using a text prompt.
 * @interface ChatsSearch
 * @extends BusterSocketRequestBase
 */
export type ChatsSearch = BusterSocketRequestBase<'/chats/search', ChatsSearchParams>;

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
  | ChatGetChat
  | ChatUnsubscribeFromChat
  | ChatListEmitPayload
  | ChatDeleteChat
  | ChatUpdateChat
  | ChatsSearch
  | ChatsDuplicateChat
  | ChatStopChat;
