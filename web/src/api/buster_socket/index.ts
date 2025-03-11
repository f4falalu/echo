import type { UserEmits, UserResponses, UserResponsesTypes } from './user';
import type { ChatEmits, ChatResponseTypes, ChatsResponses } from './chats';

export type BusterSocketRequest = UserEmits | ChatEmits;

export type BusterSocketResponse = UserResponsesTypes | ChatResponseTypes;

export type BusterSocketResponseRoute = keyof typeof UserResponses | keyof typeof ChatsResponses;
