import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { isServer } from '@tanstack/react-query';
import { PersistQueryClientProviderProps } from '@tanstack/react-query-persist-client';
import { queryKeys } from '@/api/query_keys';
import { hashKey } from '@tanstack/react-query';
import packageJson from '../../../package.json';

const buster = packageJson.version;

export const PERSIST_TIME = 1000 * 60 * 60 * 24 * 3; // 3 days

const persister = createSyncStoragePersister({
  storage: isServer ? undefined : window.localStorage,
  throttleTime: 1500 // 1.5 seconds
});

export const PERSISTED_QUERIES = [
  queryKeys.favoritesGetList.queryKey,
  queryKeys.logsGetList({}).queryKey,
  queryKeys.chatsGetList({}).queryKey,
  queryKeys.dashboardGetList({}).queryKey,
  queryKeys.metricsGetList({}).queryKey,
  queryKeys.collectionsGetList({}).queryKey
].map(hashKey);

export const PERMANENT_QUERIES = [queryKeys.getCurrencies.queryKey].map(hashKey);

const ALL_PERSISTED_QUERIES = [...PERSISTED_QUERIES, ...PERMANENT_QUERIES];
export const persistOptions: PersistQueryClientProviderProps['persistOptions'] = {
  persister: persister,
  maxAge: PERSIST_TIME,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      return ALL_PERSISTED_QUERIES.includes(query.queryHash);
    }
  },
  buster: buster
};
