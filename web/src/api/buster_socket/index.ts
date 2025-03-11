import type { UserEmits, UserResponses, UserResponsesTypes } from './user';
import type { TeamEmits, TeamResponses, TeamResponsesTypes } from './teams';
import type { TermsEmits, TermsResponses, TermsResponseTypes } from './terms';
import type { ChatEmits, ChatResponseTypes, ChatsResponses } from './chats';

export type BusterSocketRequest = UserEmits | TeamEmits | TermsEmits | ChatEmits;

export type BusterSocketResponse =
  | UserResponsesTypes
  | TeamResponsesTypes
  | TermsResponseTypes
  | ChatResponseTypes;

export type BusterSocketResponseRoute =
  | keyof typeof UserResponses
  | keyof typeof TeamResponses
  | keyof typeof TermsResponses
  | keyof typeof ChatsResponses;
