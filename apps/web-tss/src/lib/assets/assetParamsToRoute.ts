import type { AssetType } from '@buster/server-shared/assets';
import type { FileRouteTypes } from '@/routeTree.gen';
import type { BusterNavigateOptions } from '../tss-routes';

type RouteFilePaths = FileRouteTypes['to'];

/**
 * Type definitions for asset route parameters
 */
type ChatParamsToRoute = {
  assetType: 'chat';
  assetId: string;
  metricId?: string;
  dashboardId?: string;
  reportId?: string;
};

type MetricParamsToRoute = {
  assetType: 'metric';
  assetId: string;
  dashboardId?: string;
  reportId?: string;
  chatId?: string;
};

type DashboardParamsToRoute = {
  assetType: 'dashboard';
  assetId: string;
  metricId?: string;
  reportId?: string;
  chatId?: string;
};

type ReportParamsToRoute = {
  assetType: 'report';
  assetId: string;
  metricId?: string;
  chatId?: string;
};

type CollectionParamsToRoute = {
  assetType: 'collection';
  assetId: string;
  chatId?: string;
  metricId?: string;
  dashboardId?: string;
};

export type AssetParamsToRoute =
  | ChatParamsToRoute
  | MetricParamsToRoute
  | DashboardParamsToRoute
  | ReportParamsToRoute
  | CollectionParamsToRoute;

/**
 * Route builder internal state type
 */
type RouteBuilderState = {
  collectionId?: string;
  chatId?: string;
  metricId?: string;
  dashboardId?: string;
  reportId?: string;
};

/**
 * Type-safe route mapping based on parameter combinations
 */
const ROUTE_MAP: Record<string, RouteFilePaths> = {
  // Single asset routes
  chat: '/app/chats/$chatId',
  dashboard: '/app/dashboards/$dashboardId',
  metric: '/app/metrics/$metricId',
  report: '/app/reports/$reportId',
  collection: '/app/collections/$collectionId',

  // Chat combination routes
  'chat+dashboard': '/app/chats/$chatId/dashboard/$dashboardId',
  'chat+metric': '/app/chats/$chatId/metrics/$metricId',
  'chat+report': '/app/chats/$chatId/report/$reportId',
  'chat+dashboard+metric': '/app/chats/$chatId/dashboard/$dashboardId/metrics/$metricId',
  'chat+report+metric': '/app/chats/$chatId/report/$reportId/metrics/$metricId',

  // Collection combination routes
  'collection+chat': '/app/collections/$collectionId/chats/$chatId',
  'collection+dashboard': '/app/collections/$collectionId/dashboard/$dashboardId',
  'collection+metric': '/app/collections/$collectionId/metrics/$metricId',
  'collection+chat+dashboard':
    '/app/collections/$collectionId/chats/$chatId/dashboards/$dashboardId',
  'collection+chat+metric': '/app/collections/$collectionId/chats/$chatId/metrics/$metricId',
  'collection+dashboard+metric':
    '/app/collections/$collectionId/dashboard/$dashboardId/metrics/$metricId',
  'collection+chat+dashboard+metric':
    '/app/collections/$collectionId/chats/$chatId/dashboards/$dashboardId/metrics/$metricId',
} as const;

// Type-check that all routes are valid
type _RouteMapCheck = typeof ROUTE_MAP extends Record<string, FileRouteTypes['to']> ? true : false;
type RouteMap = typeof ROUTE_MAP;

/**
 * Helper type to get valid route keys based on builder state
 */
type GetRouteKey<T extends RouteBuilderState> =
  // Collection combination routes (most specific first)
  T extends { collectionId: string; chatId: string; dashboardId: string; metricId: string }
    ? 'collection+chat+dashboard+metric'
    : T extends { collectionId: string; chatId: string; dashboardId: string }
      ? 'collection+chat+dashboard'
      : T extends { collectionId: string; chatId: string; metricId: string }
        ? 'collection+chat+metric'
        : T extends { collectionId: string; dashboardId: string; metricId: string }
          ? 'collection+dashboard+metric'
          : T extends { collectionId: string; chatId: string }
            ? 'collection+chat'
            : T extends { collectionId: string; dashboardId: string }
              ? 'collection+dashboard'
              : T extends { collectionId: string; metricId: string }
                ? 'collection+metric'
                : T extends { collectionId: string }
                  ? 'collection'
                  : // Chat combination routes
                    T extends { chatId: string; dashboardId: string; metricId: string }
                    ? 'chat+dashboard+metric'
                    : T extends { chatId: string; reportId: string; metricId: string }
                      ? 'chat+report+metric'
                      : T extends { chatId: string; dashboardId: string }
                        ? 'chat+dashboard'
                        : T extends { chatId: string; reportId: string }
                          ? 'chat+report'
                          : T extends { chatId: string; metricId: string }
                            ? 'chat+metric'
                            : T extends { chatId: string }
                              ? 'chat'
                              : // Single asset routes
                                T extends { dashboardId: string }
                                ? 'dashboard'
                                : T extends { metricId: string }
                                  ? 'metric'
                                  : T extends { reportId: string }
                                    ? 'report'
                                    : never;

/**
 * Type-safe route builder with fluent API
 */
class RouteBuilder<T extends RouteBuilderState = NonNullable<unknown>> {
  private state: T;

  constructor(state: T = {} as T) {
    this.state = state;
  }

  /**
   * Add collection ID to the route
   */
  withCollection<U extends string>(collectionId: U): RouteBuilder<T & { collectionId: U }> {
    return new RouteBuilder({ ...this.state, collectionId });
  }

  /**
   * Add chat ID to the route
   */
  withChat<U extends string>(chatId: U): RouteBuilder<T & { chatId: U }> {
    return new RouteBuilder({ ...this.state, chatId });
  }

  /**
   * Add metric ID to the route
   */
  withMetric<U extends string>(metricId: U): RouteBuilder<T & { metricId: U }> {
    return new RouteBuilder({ ...this.state, metricId });
  }

  /**
   * Add dashboard ID to the route
   */
  withDashboard<U extends string>(dashboardId: U): RouteBuilder<T & { dashboardId: U }> {
    return new RouteBuilder({ ...this.state, dashboardId });
  }

  /**
   * Add report ID to the route
   */
  withReport<U extends string>(reportId: U): RouteBuilder<T & { reportId: U }> {
    return new RouteBuilder({ ...this.state, reportId });
  }

  /**
   * Build the route path with type safety
   */
  build(): GetRouteKey<T> extends keyof RouteMap ? RouteMap[GetRouteKey<T>] : never {
    const key = this.getRouteKey();

    return ROUTE_MAP[key as keyof RouteMap] as GetRouteKey<T> extends keyof RouteMap
      ? RouteMap[GetRouteKey<T>]
      : never;
  }

  /**
   * Get the route params object for TanStack Router navigation
   */
  getParams(): T {
    return this.state;
  }

  /**
   * Build navigation options with route and params
   */
  buildNavigationOptions(): BusterNavigateOptions {
    const route = this.build();
    const params = this.getParams();

    // Type assertion through unknown for complex generic type
    return {
      to: route,
      params,
    };
  }

  /**
   * Determine the route key based on current state
   */
  private getRouteKey(): string {
    const { collectionId, chatId, dashboardId, metricId, reportId } = this.state;

    // Collection combination routes (most specific first)
    if (collectionId && chatId && dashboardId && metricId)
      return 'collection+chat+dashboard+metric';
    if (collectionId && chatId && dashboardId) return 'collection+chat+dashboard';
    if (collectionId && chatId && metricId) return 'collection+chat+metric';
    if (collectionId && dashboardId && metricId) return 'collection+dashboard+metric';
    if (collectionId && chatId) return 'collection+chat';
    if (collectionId && dashboardId) return 'collection+dashboard';
    if (collectionId && metricId) return 'collection+metric';

    // Chat combination routes (most specific first)
    if (chatId && dashboardId && metricId) return 'chat+dashboard+metric';
    if (chatId && reportId && metricId) return 'chat+report+metric';
    if (chatId && dashboardId) return 'chat+dashboard';
    if (chatId && reportId) return 'chat+report';
    if (chatId && metricId) return 'chat+metric';

    // Single asset routes
    if (collectionId) return 'collection';
    if (chatId) return 'chat';
    if (dashboardId) return 'dashboard';
    if (metricId) return 'metric';
    if (reportId) return 'report';

    throw new Error('No valid route could be determined from the provided parameters');
  }
}

/**
 * Main function to convert asset params to route navigation options
 * Returns type-safe navigation options that can be passed to Link or navigate
 */
export const assetParamsToRoute = (params: AssetParamsToRoute): BusterNavigateOptions => {
  const builder = new RouteBuilder();

  const typedAssetTypes: AssetType = params.assetType;

  // Build route based on asset type and additional params
  switch (params.assetType) {
    case 'chat': {
      let route = builder.withChat(params.assetId);
      if (params.dashboardId) route = route.withDashboard(params.dashboardId);
      if (params.reportId) route = route.withReport(params.reportId);
      if (params.metricId) route = route.withMetric(params.metricId);
      return route.buildNavigationOptions();
    }

    case 'metric': {
      let route = builder.withMetric(params.assetId);
      if (params.chatId) {
        route = route.withChat(params.chatId);
        if (params.dashboardId) route = route.withDashboard(params.dashboardId);
        if (params.reportId) route = route.withReport(params.reportId);
      }
      return route.buildNavigationOptions();
    }

    case 'dashboard': {
      let route = builder.withDashboard(params.assetId);
      if (params.chatId) {
        route = route.withChat(params.chatId);
        if (params.metricId) route = route.withMetric(params.metricId);
      }
      return route.buildNavigationOptions();
    }

    case 'report': {
      let route = builder.withReport(params.assetId);
      if (params.chatId) {
        route = route.withChat(params.chatId);
        if (params.metricId) route = route.withMetric(params.metricId);
      }
      return route.buildNavigationOptions();
    }

    case 'collection': {
      let route = builder.withCollection(params.assetId);
      if (params.chatId) route = route.withChat(params.chatId);
      if (params.dashboardId) route = route.withDashboard(params.dashboardId);
      if (params.metricId) route = route.withMetric(params.metricId);
      return route.buildNavigationOptions();
    }

    default:
      throw new Error(`Unknown asset type: ${(params as AssetParamsToRoute).assetType}`);
  }
};

/**
 * Create a new route builder instance
 */
export const createRouteBuilder = () => new RouteBuilder();

/**
 * Helper function to get just the route path from asset params
 * Use this when you only need the path string without params
 */
export const assetParamsToRoutePath = (params: AssetParamsToRoute): RouteFilePaths => {
  const navOptions = assetParamsToRoute(params);
  return navOptions.to as RouteFilePaths;
};
