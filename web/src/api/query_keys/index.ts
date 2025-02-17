import { chatQueryKeys } from './chat';
import { collectionQueryKeys } from './collection';
import { userQueryKeys } from './users';
import { dashboardQueryKeys } from './dashboard';
import { metricsQueryKeys } from './metric';
import { searchQueryKeys } from './search';
import { termsQueryKeys } from './terms';
import { datasourceQueryKeys } from './datasources';

export const queryKeys = {
  ...chatQueryKeys,
  ...collectionQueryKeys,
  ...userQueryKeys,
  ...dashboardQueryKeys,
  ...metricsQueryKeys,
  ...searchQueryKeys,
  ...termsQueryKeys,
  ...datasourceQueryKeys
};
