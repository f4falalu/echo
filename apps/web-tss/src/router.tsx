import type { User } from "@supabase/supabase-js";
import type { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanstackRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import * as TanstackQuery from "./integrations/tanstack-query/query-client";
import { routeTree } from "./routeTree.gen";

export interface AppRouterContext {
  queryClient: QueryClient;
  user: User | null;
}

// Create a new router instance
export const createRouter = () => {
  const queryClient = TanstackQuery.getContext();

  return routerWithQueryClient(
    createTanstackRouter({
      routeTree,
      context: { queryClient, user: null }, //context is defined in the root route
      scrollRestoration: true,
      defaultPreload: "intent",
      Wrap: (props) => {
        return (
          <TanstackQuery.Provider queryClient={queryClient}>
            {props.children}
          </TanstackQuery.Provider>
        );
      },
    }),
    queryClient,
  );
};

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
