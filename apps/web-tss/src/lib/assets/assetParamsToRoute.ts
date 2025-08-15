import type { AssetType } from '@buster/server-shared/assets';
import type { FileRouteTypes } from '@/routeTree.gen';

type RouteFilePaths = FileRouteTypes['id'];

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

type AssetParamsToRoute =
  | ChatParamsToRoute
  | MetricParamsToRoute
  | DashboardParamsToRoute
  | ReportParamsToRoute;

/**
 * Route builder internal state type
 */
type RouteBuilderState = {
  chatId?: string;
  metricId?: string;
  dashboardId?: string;
  reportId?: string;
};

/**
 * Type-safe route mapping based on parameter combinations
 */
type RouteMap = {
  // Single asset routes
  chat: '/app/chats/$chatId';
  dashboard: '/app/dashboards/$dashboardId';
  metric: '/app/metrics/$metricId';
  report: '/app/reports/$reportId';

  // Chat combination routes
  'chat+dashboard': '/app/chats/$chatId/dashboard/$dashboardId';
  'chat+metric': '/app/chats/$chatId/metrics/$metricId';
  'chat+report': '/app/chats/$chatId/report/$reportId';
  'chat+dashboard+metric': '/app/chats/$chatId/dashboard/$dashboardId/metrics/$metricId';
  'chat+report+metric': '/app/chats/$chatId/report/$reportId/metrics/$metricId';
};

/**
 * Helper type to get valid route keys based on builder state
 */
type GetRouteKey<T extends RouteBuilderState> = T extends {
  chatId: string;
  dashboardId: string;
  metricId: string;
}
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
            : T extends { dashboardId: string }
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
    const routeMap: RouteMap = {
      chat: '/app/chats/$chatId',
      dashboard: '/app/dashboards/$dashboardId',
      metric: '/app/metrics/$metricId',
      report: '/app/reports/$reportId',
      'chat+dashboard': '/app/chats/$chatId/dashboard/$dashboardId',
      'chat+metric': '/app/chats/$chatId/metrics/$metricId',
      'chat+report': '/app/chats/$chatId/report/$reportId',
      'chat+dashboard+metric': '/app/chats/$chatId/dashboard/$dashboardId/metrics/$metricId',
      'chat+report+metric': '/app/chats/$chatId/report/$reportId/metrics/$metricId',
    };

    return routeMap[key as keyof RouteMap] as GetRouteKey<T> extends keyof RouteMap
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
   * Determine the route key based on current state
   */
  private getRouteKey(): string {
    const { chatId, dashboardId, metricId, reportId } = this.state;

    // Chat combination routes (most specific first)
    if (chatId && dashboardId && metricId) return 'chat+dashboard+metric';
    if (chatId && reportId && metricId) return 'chat+report+metric';
    if (chatId && dashboardId) return 'chat+dashboard';
    if (chatId && reportId) return 'chat+report';
    if (chatId && metricId) return 'chat+metric';

    // Single asset routes
    if (chatId) return 'chat';
    if (dashboardId) return 'dashboard';
    if (metricId) return 'metric';
    if (reportId) return 'report';

    throw new Error('No valid route could be determined from the provided parameters');
  }
}

/**
 * Main function to convert asset params to route
 */
export const assetParamsToRoute = (params: AssetParamsToRoute): RouteFilePaths => {
  const builder = new RouteBuilder();

  // Build route based on asset type and additional params
  switch (params.assetType) {
    case 'chat': {
      let route = builder.withChat(params.assetId);
      if (params.dashboardId) route = route.withDashboard(params.dashboardId);
      if (params.reportId) route = route.withReport(params.reportId);
      if (params.metricId) route = route.withMetric(params.metricId);
      return route.build() as RouteFilePaths;
    }

    case 'metric': {
      let route = builder.withMetric(params.assetId);
      if (params.chatId) {
        route = route.withChat(params.chatId);
        if (params.dashboardId) route = route.withDashboard(params.dashboardId);
        if (params.reportId) route = route.withReport(params.reportId);
      }
      return route.build() as RouteFilePaths;
    }

    case 'dashboard': {
      let route = builder.withDashboard(params.assetId);
      if (params.chatId) {
        route = route.withChat(params.chatId);
        if (params.metricId) route = route.withMetric(params.metricId);
      }
      return route.build() as RouteFilePaths;
    }

    case 'report': {
      let route = builder.withReport(params.assetId);
      if (params.chatId) {
        route = route.withChat(params.chatId);
        if (params.metricId) route = route.withMetric(params.metricId);
      }
      return route.build() as RouteFilePaths;
    }

    default:
      throw new Error(`Unknown asset type: ${(params as AssetParamsToRoute).assetType}`);
  }
};

/**
 * Create a new route builder instance
 */
export const createRouteBuilder = () => new RouteBuilder();

// Example usage:
// const route1 = createRouteBuilder()
//   .withChat('chat-123')
//   .withMetric('metric-456')
//   .build(); // Type: '/app/chats/$chatId/metrics/$metricId'
//
// const route2 = assetParamsToRoute({
//   assetType: 'dashboard',
//   assetId: 'dash-123',
//   chatId: 'chat-456',
//   metricId: 'metric-789'
// }); // Returns: '/app/chats/$chatId/dashboard/$dashboardId/metrics/$metricId'
