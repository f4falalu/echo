import { chatQueryKeys } from './chat/queryKeys';
import { collectionQueryKeys } from './collection/queryKeys';
import { userQueryKeys } from './users/queryKeys';
import { dashboardQueryKeys } from './dashboard/queryKeys';
import { metricsQueryKeys } from './metric/queryKeys';
import { searchQueryKeys } from './search';
import { termsQueryKeys } from './terms/queryKeys';

export const queryKeys = {
  ...chatQueryKeys,
  ...collectionQueryKeys,
  ...userQueryKeys,
  ...dashboardQueryKeys,
  ...metricsQueryKeys,
  ...searchQueryKeys,
  ...termsQueryKeys
};
