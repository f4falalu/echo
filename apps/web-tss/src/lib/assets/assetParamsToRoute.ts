import type { FileRouteTypes } from '@/routeTree.gen';
import type { ILinkProps } from '@/types/routes';

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
  dashboardVersionNumber?: number;
  metricVersionNumber?: number;
  reportVersionNumber?: number;
};

type MetricParamsToRoute = {
  assetType: 'metric';
  assetId: string;
  dashboardId?: string;
  reportId?: string;
  chatId?: string;
  versionNumber?: number;
};

type DashboardParamsToRoute = {
  assetType: 'dashboard';
  assetId: string;
  metricId?: string;
  reportId?: string;
  chatId?: string;
  versionNumber?: number;
  metricVersionNumber?: number;
};

type ReportParamsToRoute = {
  assetType: 'report';
  assetId: string;
  metricId?: string;
  chatId?: string;
  versionNumber?: number;
  metricVersionNumber?: number;
};

type CollectionParamsToRoute = {
  assetType: 'collection';
  assetId: string;
  chatId?: string;
  metricId?: string;
  dashboardId?: string;
  metricVersionNumber?: number;
  dashboardVersionNumber?: number;
};

type ReasoningParamsToRoute = {
  assetType: 'reasoning';
  assetId: string;
  chatId: string;
};

export type AssetParamsToRoute =
  | ChatParamsToRoute
  | MetricParamsToRoute
  | DashboardParamsToRoute
  | ReportParamsToRoute
  | CollectionParamsToRoute
  | ReasoningParamsToRoute;

/**
 * Route builder internal state type
 */
type RouteBuilderState = {
  collectionId?: string;
  chatId?: string;
  metricId?: string;
  dashboardId?: string;
  reportId?: string;
  // Version numbers for search parameters
  versionNumber?: number;
  metricVersionNumber?: number;
  dashboardVersionNumber?: number;
  reportVersionNumber?: number;
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

  // Direct asset combination routes
  'dashboard+metric': '/app/dashboards/$dashboardId/metrics/$metricId',
  'report+metric': '/app/reports/$reportId/metrics/$metricId',

  // Chat combination routes
  'chat+dashboard': '/app/chats/$chatId/dashboards/$dashboardId',
  'chat+metric': '/app/chats/$chatId/metrics/$metricId',
  'chat+report': '/app/chats/$chatId/report/$reportId',
  'chat+dashboard+metric': '/app/chats/$chatId/dashboards/$dashboardId/metrics/$metricId',
  'chat+report+metric': '/app/chats/$chatId/report/$reportId/metrics/$metricId',

  // Collection combination routes
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
                              : // Direct asset combination routes
                                T extends { dashboardId: string; metricId: string }
                                ? 'dashboard+metric'
                                : T extends { reportId: string; metricId: string }
                                  ? 'report+metric'
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
   * Add version number to the route (for the primary asset)
   * The search parameter name will be determined based on the primary asset type:
   * - metric_version_number for metrics
   * - dashboard_version_number for dashboards
   * - report_version_number for reports
   */
  withVersion<U extends number>(versionNumber: U): RouteBuilder<T & { versionNumber: U }> {
    return new RouteBuilder({ ...this.state, versionNumber });
  }

  /**
   * Add metric version number to the route
   */
  withMetricVersion<U extends number>(
    metricVersionNumber: U
  ): RouteBuilder<T & { metricVersionNumber: U }> {
    return new RouteBuilder({ ...this.state, metricVersionNumber });
  }

  /**
   * Add dashboard version number to the route
   */
  withDashboardVersion<U extends number>(
    dashboardVersionNumber: U
  ): RouteBuilder<T & { dashboardVersionNumber: U }> {
    return new RouteBuilder({ ...this.state, dashboardVersionNumber });
  }

  /**
   * Add report version number to the route
   */
  withReportVersion<U extends number>(
    reportVersionNumber: U
  ): RouteBuilder<T & { reportVersionNumber: U }> {
    return new RouteBuilder({ ...this.state, reportVersionNumber });
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
  buildNavigationOptions(): ILinkProps {
    const route = this.build();
    const params = this.getParams();
    const search = this.getSearchParams();

    // Build navigation options object, only including non-empty params and search
    const navOptions: Record<string, unknown> = { to: route };

    // Only include params if they contain actual route parameters (excluding version numbers)
    const routeParams = this.getRouteOnlyParams();
    if (Object.keys(routeParams).length > 0) {
      navOptions.params = routeParams;
    }

    // Only include search if it contains version numbers
    if (Object.keys(search).length > 0) {
      navOptions.search = search;
    }

    // Type assertion through unknown for complex generic type
    return navOptions as unknown as ILinkProps;
  }

  /**
   * Get only the route parameters (excluding version numbers)
   */
  private getRouteOnlyParams(): Record<string, unknown> {
    const {
      versionNumber,
      metricVersionNumber,
      dashboardVersionNumber,
      reportVersionNumber,
      ...routeParams
    } = this.state;
    return routeParams as Record<string, unknown>;
  }

  /**
   * Get search parameters for version numbers
   */
  private getSearchParams(): Record<string, number> {
    const search: Record<string, number> = {};
    const { versionNumber, metricVersionNumber, dashboardVersionNumber, reportVersionNumber } =
      this.state;

    // Map internal version numbers to TanStack Router search parameter names
    if (versionNumber !== undefined) {
      // For primary asset version, determine the correct search param name based on route structure
      const { metricId, dashboardId, reportId, chatId, collectionId } = this.state;

      if (dashboardId && !chatId && !collectionId) {
        // Direct dashboard route or dashboard+metric route
        search.dashboard_version_number = versionNumber;
      } else if (reportId && !chatId && !collectionId) {
        // Direct report route or report+metric route
        search.report_version_number = versionNumber;
      } else if (metricId && !dashboardId && !reportId) {
        // Pure metric route
        search.metric_version_number = versionNumber;
      } else if (metricId) {
        // Complex route with metric - metric is the most specific asset
        search.metric_version_number = versionNumber;
      } else if (dashboardId) {
        // Complex route with dashboard (but no metric)
        search.dashboard_version_number = versionNumber;
      } else if (reportId) {
        // Complex route with report (but no metric/dashboard)
        search.report_version_number = versionNumber;
      }
    }

    if (metricVersionNumber !== undefined) {
      search.metric_version_number = metricVersionNumber;
    }

    if (dashboardVersionNumber !== undefined) {
      search.dashboard_version_number = dashboardVersionNumber;
    }

    if (reportVersionNumber !== undefined) {
      search.report_version_number = reportVersionNumber;
    }

    return search;
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

    // Direct asset combination routes
    if (dashboardId && metricId) return 'dashboard+metric';
    if (reportId && metricId) return 'report+metric';

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
 *
 * @example
 * // Navigate to a metric with version
 * const options = assetParamsToRoute({
 *   assetType: 'metric',
 *   assetId: 'metric-123',
 *   versionNumber: 5
 * });
 * // Result: { to: '/app/metrics/metric-123', params: { metricId: 'metric-123' }, search: { metric_version_number: 5 } }
 *
 * @example
 * // Navigate to standalone asset (no params or search when empty)
 * const options = assetParamsToRoute({
 *   assetType: 'dashboard',
 *   assetId: 'dashboard-456'
 * });
 * // Result: { to: '/app/dashboards/dashboard-456', params: { dashboardId: 'dashboard-456' } }
 *
 * @example
 * // Navigate to dashboard with metric and both versions
 * const options = assetParamsToRoute({
 *   assetType: 'dashboard',
 *   assetId: 'dashboard-456',
 *   metricId: 'metric-789',
 *   versionNumber: 3,
 *   metricVersionNumber: 2
 * });
 * // Result: { to: '/app/dashboards/dashboard-456', params: { dashboardId: 'dashboard-456', metricId: 'metric-789' }, search: { dashboard_version_number: 3, metric_version_number: 2 } }
 */
export const assetParamsToRoute = (params: AssetParamsToRoute): ILinkProps => {
  const builder = new RouteBuilder();

  // Build route based on asset type and additional params
  switch (params.assetType) {
    case 'chat': {
      let route = builder.withChat(params.assetId);
      if (params.dashboardId) route = route.withDashboard(params.dashboardId);
      if (params.reportId) route = route.withReport(params.reportId);
      if (params.metricId) route = route.withMetric(params.metricId);

      // Add version numbers
      if (params.dashboardVersionNumber !== undefined)
        route = route.withDashboardVersion(params.dashboardVersionNumber);
      if (params.metricVersionNumber !== undefined)
        route = route.withMetricVersion(params.metricVersionNumber);
      if (params.reportVersionNumber !== undefined)
        route = route.withReportVersion(params.reportVersionNumber);

      return route.buildNavigationOptions();
    }

    case 'metric': {
      let route = builder.withMetric(params.assetId);
      if (params.chatId) {
        route = route.withChat(params.chatId);
        if (params.dashboardId) route = route.withDashboard(params.dashboardId);
        if (params.reportId) route = route.withReport(params.reportId);
      }

      // Add version number for the metric
      if (params.versionNumber !== undefined) route = route.withVersion(params.versionNumber);

      return route.buildNavigationOptions();
    }

    case 'dashboard': {
      let route = builder.withDashboard(params.assetId);
      if (params.chatId) {
        route = route.withChat(params.chatId);
        if (params.metricId) route = route.withMetric(params.metricId);
      } else if (params.metricId) {
        // Direct dashboard+metric route (without chat context)
        route = route.withMetric(params.metricId);
      }

      // Add version numbers
      if (params.versionNumber !== undefined) route = route.withVersion(params.versionNumber);
      if (params.metricVersionNumber !== undefined)
        route = route.withMetricVersion(params.metricVersionNumber);

      return route.buildNavigationOptions();
    }

    case 'report': {
      let route = builder.withReport(params.assetId);
      if (params.chatId) {
        route = route.withChat(params.chatId);
        if (params.metricId) route = route.withMetric(params.metricId);
      } else if (params.metricId) {
        // Direct report+metric route (without chat context)
        route = route.withMetric(params.metricId);
      }

      // Add version numbers
      if (params.versionNumber !== undefined) route = route.withVersion(params.versionNumber);
      if (params.metricVersionNumber !== undefined)
        route = route.withMetricVersion(params.metricVersionNumber);

      return route.buildNavigationOptions();
    }

    case 'collection': {
      let route = builder.withCollection(params.assetId);
      if (params.chatId) route = route.withChat(params.chatId);
      if (params.dashboardId) route = route.withDashboard(params.dashboardId);
      if (params.metricId) route = route.withMetric(params.metricId);

      // Add version numbers
      if (params.metricVersionNumber !== undefined)
        route = route.withMetricVersion(params.metricVersionNumber);
      if (params.dashboardVersionNumber !== undefined)
        route = route.withDashboardVersion(params.dashboardVersionNumber);

      return route.buildNavigationOptions();
    }

    case 'reasoning': {
      // Reasoning routes require both chatId and assetId (which is the messageId)
      // For now, we'll use a simple approach that matches the existing pattern
      // The reasoning route is /app/_app/_asset/chats/$chatId/reasoning/$messageId
      // Since this doesn't fit the standard RouteBuilder pattern, we'll handle it specially
      console.warn('Reasoning route implementation needs to be updated to match route tree types');
      return {
        to: '/app/_app/_asset/chats/$chatId/reasoning/$messageId' as RouteFilePaths,
        params: {
          chatId: params.chatId,
          messageId: params.assetId,
        },
      } as unknown as ILinkProps;
    }

    default:
      console.warn(`Unknown asset type: ${(params as AssetParamsToRoute).assetType}`, params);
      throw new Error(`Unknown asset type: ${(params as AssetParamsToRoute).assetType}`, params);
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
