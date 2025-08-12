import {
  type QueryClient,
  QueryClientProvider,
  type QueryClientProviderProps
} from '@tanstack/react-query';
import { openErrorNotification as openErrorNotificationMethod } from '@/context/BusterNotifications';
import { makeQueryClient } from './make-query-client';

let browserQueryClient: QueryClient | undefined;
const isServer = typeof window === 'undefined';

export function getContext() {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient();
  }
  const openErrorNotification = openErrorNotificationMethod;

  // Browser: make a new query client if we don't already have one
  // This is very important, so we don't re-make a new client if React
  // suspends during the initial render. This may not be needed if we
  // have a suspense boundary BELOW the creation of the query client
  if (!browserQueryClient) browserQueryClient = makeQueryClient({ openErrorNotification });
  return browserQueryClient;
}

export function Provider({
  children,
  queryClient
}: {
  children: QueryClientProviderProps['children'];
  queryClient: QueryClient;
}) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
