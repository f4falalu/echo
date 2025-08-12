import type { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanstackRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import * as TanstackQuery from "./integrations/tanstack-query/root-provider";
import { routeTree } from "./routeTree.gen";

export interface AppRouterContext {
  queryClient: QueryClient;
}

// Create a new router instance
export const createRouter = () => {
  const rqContext = TanstackQuery.getContext();

  return routerWithQueryClient(
    createTanstackRouter({
      routeTree,
      context: { ...rqContext }, //context is defined in the root route
      scrollRestoration: true,
      defaultPreload: "intent",
      Wrap: (props) => {
        return <TanstackQuery.Provider {...rqContext}>{props.children}</TanstackQuery.Provider>;
      },
    }),
    rqContext.queryClient,
  );
};

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
