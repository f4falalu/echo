import type { CreateNewChatParams, StopChatParams } from '../../request_interfaces/chats';
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
 * Union type of all possible chat-related request types.
 */
export type ChatEmits = ChatCreateNewChat | ChatStopChat;
