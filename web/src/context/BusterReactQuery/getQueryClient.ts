import { QueryClient, defaultShouldDehydrateQuery, isServer } from '@tanstack/react-query';
import { useBusterNotifications } from '../BusterNotifications';
import { openErrorNotification as openErrorNotificationMethod } from '../BusterNotifications';
import { PERMANENT_QUERIES } from './createPersister';

type OpenErrorNotification = ReturnType<typeof useBusterNotifications>['openErrorNotification'];

const PREFETCH_STALE_TIME = 1000 * 10; // 10 seconds
const ERROR_RETRY_DELAY = 1 * 1000; // 1 second delay after error
const GC_TIME = 1000 * 60 * 60 * 24 * 3; // 24 hours - matches persistence duration

// Track queries that have already mounted
const mountedQueries = new Set<string>();

function makeQueryClient(params?: {
  openErrorNotification?: OpenErrorNotification;
  enabled?: boolean;
  accessToken?: string;
}) {
  const baseEnabled = params?.accessToken !== undefined ? !!params.accessToken : true;
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: PREFETCH_STALE_TIME,
        gcTime: GC_TIME,
        enabled: (params?.enabled ?? true) && baseEnabled,
        queryFn: () => Promise.resolve(),
        retry: (failureCount, error) => {
          if (params?.openErrorNotification) {
            params.openErrorNotification(error);
          }
          return false;
        },
        retryDelay: ERROR_RETRY_DELAY,
        refetchOnMount: (query) => {
          console.log(query.queryHash, query.state.dataUpdatedAt);
          if (!query.state.dataUpdatedAt) {
            // No data has been fetched yet
            return true;
          }

          if (!mountedQueries.has(query.queryHash) && query.isActive()) {
            // First time mounting this query
            mountedQueries.add(query.queryHash);
            return 'always';
          }

          // Query has mounted before, use default stale time behavior
          return query.state.dataUpdatedAt < Date.now() - PREFETCH_STALE_TIME;
        }
      },
      mutations: {
        retry: (failureCount, error) => {
          if (params?.openErrorNotification) {
            params.openErrorNotification(error);
          }
          return false;
        }
      },
      dehydrate: {
        // include pending queries in dehydration
        shouldDehydrateQuery: (query) => {
          return defaultShouldDehydrateQuery(query) || query.state.status === 'pending';
        }
      }
    }
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient(accessToken?: string) {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    const enabled = !!accessToken;
    const openErrorNotification = openErrorNotificationMethod;

    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient)
      browserQueryClient = makeQueryClient({ openErrorNotification, accessToken, enabled });
    return browserQueryClient;
  }
}
