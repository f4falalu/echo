import type { BusterSocketRequestBase } from '../base_interfaces';

/**
 * Request type for creating a new chat session or continuing an existing one.
 * @interface ChatCreateNewChat
 * @extends BusterSocketRequestBase
 */
export type ChatCreateNewChat = BusterSocketRequestBase<
  '/chats/post',
  {
    /** The ID of the dataset to associate with the chat. Null if no dataset is associated */
    dataset_id?: string | null;
    /** The initial message or prompt to start the chat conversation */
    prompt: string;
    /** Optional ID of an existing chat for follow-up messages. Null for new chats */
    chat_id?: string | null;
    /** Optional ID of a clicked suggestion. If provided, returns that specific chat */
    suggestion_id?: string | null;
    /** Optional ID of a message to replace in an existing chat */
    message_id?: string;
    /** Optional ID of a metric to initialize the chat from */
    metric_id?: string;
    /** Optional ID of a dashboard to initialize the chat from */
    dashboard_id?: string;
  }
>;

/**
 * Request type for stopping an active chat or message generation.
 * @interface ChatStopChat
 * @extends BusterSocketRequestBase
 */
export type ChatStopChat = BusterSocketRequestBase<
  '/chats/stop',
  {
    /** The unique identifier of the chat to stop */
    id: string;
    /** The ID of the specific message to stop generating */
    message_id: string;
  }
>;

/**
 * Request type for retrieving a specific chat by its ID.
 * @interface ChatGetChat
 * @extends BusterSocketRequestBase
 */
export type ChatGetChat = BusterSocketRequestBase<
  '/chats/get',
  {
    /** The unique identifier of the chat to retrieve */
    id: string;
  }
>;

/**
 * Request type for unsubscribing from real-time updates of a specific chat.
 * @interface ChatUnsubscribeFromChat
 * @extends BusterSocketRequestBase
 */
export type ChatUnsubscribeFromChat = BusterSocketRequestBase<
  '/chats/unsubscribe',
  {
    /** The unique identifier of the chat to unsubscribe from */
    id: string;
  }
>;

/**
 * Request type for retrieving a paginated list of chats.
 * @interface ChatListEmitPayload
 * @extends BusterSocketRequestBase
 */
export type ChatListEmitPayload = BusterSocketRequestBase<
  '/chats/list',
  {
    /** Pagination token indicating the page number */
    page_token: number;
    /** Number of chat items to return per page */
    page_size: number;
    /** When true, shows all organization chats (admin only). When false, shows only user's chats */
    admin_view: boolean;
  }
>;

/**
 * Request type for deleting a specific chat.
 * @interface ChatDeleteChat
 * @extends BusterSocketRequestBase
 */
export type ChatDeleteChat = BusterSocketRequestBase<
  '/chats/delete',
  {
    /** The unique identifier of the chat to delete */
    id: string;
  }[]
>;

/**
 * Request type for updating chat properties.
 * @interface ChatUpdateChat
 * @extends BusterSocketRequestBase
 */
export type ChatUpdateChat = BusterSocketRequestBase<
  '/chats/update',
  {
    /** The unique identifier of the chat to update */
    id: string;
    /** Optional new title to set for the chat */
    title?: string;
    /** Optional flag to set the chat's favorite status */
    is_favorited?: boolean;
  }
>;

/**
 * Request type for searching through chats using a text prompt.
 * @interface ChatsSearch
 * @extends BusterSocketRequestBase
 */
export type ChatsSearch = BusterSocketRequestBase<
  '/chats/search',
  {
    /** The search query string to match against chats */
    prompt: string;
  }
>;

/**
 * Request type for duplicating an existing chat.
 * @interface ChatsDuplicateChat
 * @extends BusterSocketRequestBase
 */
export type ChatsDuplicateChat = BusterSocketRequestBase<
  '/chats/duplicate',
  {
    /** The unique identifier of the source chat to duplicate */
    id: string;
    /** The message ID to start the duplication from */
    message_id: string;
    /** The target chat ID to duplicate content to */
    chat_id: string;
  }
>;

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
