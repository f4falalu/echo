import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { hashKey, isServer } from '@tanstack/react-query';
import type { PersistQueryClientProviderProps } from '@tanstack/react-query-persist-client';
import { dictionariesQueryKeys } from '@/api/query_keys/dictionaries';
import { slackQueryKeys } from '@/api/query_keys/slack';
import packageJson from '../../../package.json';

const buster = packageJson.version;
export const PERSIST_TIME = 1000 * 60 * 60 * 24 * 3; // 3 days
const PERSISTED_QUERIES = [slackQueryKeys.slackGetChannels.queryKey].map(hashKey);

export const PERMANENT_QUERIES = [
  dictionariesQueryKeys.getCurrencies.queryKey,
  dictionariesQueryKeys.colorPalettes.queryKey,
].map(hashKey);

const ALL_PERSISTED_QUERIES = [...PERSISTED_QUERIES, ...PERMANENT_QUERIES];

const persisterAsync = createAsyncStoragePersister({
  key: 'buster-query-cache',
  storage: isServer ? undefined : window.localStorage,
  throttleTime: 1500, // 1.5 seconds,
  serialize: (client) => {
    /*
     * Make persisted queries appear stale on first load by setting the dataUpdatedAt to 1 (NOT 0)
     * This way the query will be refetched from the server when it is first mounted AND we
     * don't have to deal with the flash of stale data that would otherwise happen.
     */
    for (const query of client.clientState.queries) {
      const isPermanentQuery = PERMANENT_QUERIES.includes(query.queryHash);
      if (!isPermanentQuery) {
        console.log('setting dataUpdatedAt to 1', query.queryHash);
        query.state.dataUpdatedAt = 1;
      }
    }
    return JSON.stringify(client);
  },
});

export const persistOptions: PersistQueryClientProviderProps['persistOptions'] = {
  maxAge: PERSIST_TIME,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      const isList =
        query.queryKey[1] === 'list' || query.queryKey[query.queryKey.length - 1] === 'list';

      return isList || ALL_PERSISTED_QUERIES.includes(query.queryHash);
    },
  },
  hydrateOptions: {
    defaultOptions: {
      queries: {
        initialDataUpdatedAt: 0,
      },
    },
  },
  buster,
  persister: persisterAsync,
};
