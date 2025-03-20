export interface GetChatParams {
  /** The unique identifier of the chat to retrieve */
  id: string;
}

export interface CreateNewChatParams {
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

export interface StopChatParams {
  /** The unique identifier of the chat to stop */
  id: string;
  /** The ID of the specific message to stop generating */
  message_id: string;
}

export interface UnsubscribeFromChatParams {
  /** The unique identifier of the chat to unsubscribe from */
  id: string;
}

export interface DeleteChatParams {
  /** The unique identifier of the chat to delete */
  id: string;
}

export interface UpdateChatParams {
  /** The unique identifier of the chat to update */
  id: string;
  /** Optional new title to set for the chat */
  title?: string;
  /** Optional flag to set the chat's favorite status */
  is_favorited?: boolean;
  /** Optional feedback to set for the chat */
  feedback?: 'negative' | null;
}

export interface ChatsSearchParams {
  /** The search query string to match against chats */
  prompt: string;
}

export interface DuplicateChatParams {
  /** The unique identifier of the source chat to duplicate */
  id: string;
  /** The message ID to start the duplication from */
  message_id: string;
  /** Whether to share the duplicated chat with the same people as the source chat */
  share_with_same_people: boolean;
}

export interface DuplicateChatResponse {
  /** The unique identifier of the duplicated chat */
  id: string;
  /** The title of the duplicated chat */
  title: string;
}
