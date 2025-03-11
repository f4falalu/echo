import type { SQLEmits, SQLResponses, SQLResponsesTypes } from './sql';
import type { UserEmits, UserResponses, UserResponsesTypes } from './user';
import type { TeamEmits, TeamResponses, TeamResponsesTypes } from './teams';
import type { TermsEmits, TermsResponses, TermsResponseTypes } from './terms';
import type { BusterSearchEmits, SearchResponses, SearchResponseTypes } from './search';
import type {
  OrganizationResponses,
  OrganizationResponsesTypes,
  OrganizationsEmits
} from './organizations';
import type { ChatEmits, ChatResponseTypes, ChatsResponses } from './chats';

export type BusterSocketRequest =
  | UserEmits
  | TeamEmits
  | SQLEmits
  | TermsEmits
  | BusterSearchEmits
  | OrganizationsEmits
  | ChatEmits;

export type BusterSocketResponse =
  | UserResponsesTypes
  | TeamResponsesTypes
  | SQLResponsesTypes
  | TermsResponseTypes
  | SearchResponseTypes
  | OrganizationResponsesTypes
  | ChatResponseTypes;

export type BusterSocketResponseRoute =
  | keyof typeof UserResponses
  | keyof typeof TeamResponses
  | keyof typeof SQLResponses
  | keyof typeof TermsResponses
  | keyof typeof SearchResponses
  | keyof typeof OrganizationResponses
  | keyof typeof ChatsResponses;

export type * from './shared_interfaces';
