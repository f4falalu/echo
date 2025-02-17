import type { MetricResponses, MetricEmits, MetricResponseTypes } from './metrics';
import type { DashboardResponseTypes, DashboardEmits, DashboardResponses } from './dashboards';
import type { DatasetEmits, DatasetResponseTypes, DatasetResponses } from './datasets';
import type { SQLEmits, SQLResponses, SQLResponsesTypes } from './sql';
import type { UserEmits, UserResponses, UserResponsesTypes } from './user';
import type { CollectionResponseTypes, CollectionResponses, CollectionsEmit } from './collections';
import type { TeamEmits, TeamResponses, TeamResponsesTypes } from './teams';
import type { DatasourceResponseTypes, DatasourceResponses, DatasourceEmits } from './datasources';
import type { TermsEmits, TermsResponses, TermsResponseTypes } from './terms';
import type { BusterSearchEmits, SearchResponses, SearchResponseTypes } from './search';
import type {
  OrganizationResponses,
  OrganizationResponsesTypes,
  OrganizationsEmits
} from './organizations';
import type { ChatEmits, ChatResponseTypes, ChatsResponses } from './chats';

export type BusterSocketRequest =
  | MetricEmits
  | DashboardEmits
  | DatasetEmits
  | UserEmits
  | CollectionsEmit
  | TeamEmits
  | DatasourceEmits
  | SQLEmits
  | TermsEmits
  | BusterSearchEmits
  | OrganizationsEmits
  | ChatEmits;

export type BusterSocketResponse =
  | MetricResponseTypes
  | DashboardResponseTypes
  | DatasetResponseTypes
  | UserResponsesTypes
  | CollectionResponseTypes
  | TeamResponsesTypes
  | DatasourceResponseTypes
  | SQLResponsesTypes
  | TermsResponseTypes
  | SearchResponseTypes
  | OrganizationResponsesTypes
  | ChatResponseTypes;

export type BusterSocketResponseRoute =
  | keyof typeof MetricResponses
  | keyof typeof DashboardResponses
  | keyof typeof DatasetResponses
  | keyof typeof UserResponses
  | keyof typeof CollectionResponses
  | keyof typeof TeamResponses
  | keyof typeof DatasourceResponses
  | keyof typeof SQLResponses
  | keyof typeof TermsResponses
  | keyof typeof SearchResponses
  | keyof typeof OrganizationResponses
  | keyof typeof ChatsResponses;

export type * from './shared_interfaces';
