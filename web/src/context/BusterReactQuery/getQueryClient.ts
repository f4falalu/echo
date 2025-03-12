import { QueryClient, defaultShouldDehydrateQuery, isServer } from '@tanstack/react-query';
import { useBusterNotifications } from '../BusterNotifications';
import { openErrorNotification as openErrorNotificationMethod } from '../BusterNotifications';

type OpenErrorNotification = ReturnType<typeof useBusterNotifications>['openErrorNotification'];

export const PREFETCH_STALE_TIME = 1000 * 10;

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
        refetchOnMount: true,
        staleTime: PREFETCH_STALE_TIME,
        enabled: (params?.enabled ?? true) && baseEnabled,
        queryFn: () => Promise.resolve(),
        retry: (failureCount, error) => {
          if (params?.openErrorNotification) {
            params.openErrorNotification(error);
          }
          return false;
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
