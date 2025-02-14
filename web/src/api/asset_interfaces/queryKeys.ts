import { chatQueryKeys } from './chat/queryKeys';
import { collectionQueryKeys } from './collection/queryKeys';
import { userQueryKeys } from './users/queryKeys';
import { dashboardQueryKeys } from './dashboard/queryKeys';
import { metricsQueryKeys } from './metric/queryKeys';
import { searchQueryKeys } from './search/queryKeys';
import { termsQueryKeys } from './terms/queryKeys';
import { datasourceQueryKeys } from './datasources/queryKeys';

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
