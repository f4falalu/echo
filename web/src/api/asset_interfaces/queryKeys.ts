import { chatQueryKeys } from './chat/queryKeys';
import { collectionQueryKeys } from './collection/queryKeys';
import { userQueryKeys } from './users/queryKeys';
import { dashboardQueryKeys } from './dashboard/queryKeys';

export const queryKeys = {
  ...chatQueryKeys,
  ...collectionQueryKeys,
  ...userQueryKeys,
  ...dashboardQueryKeys
};
