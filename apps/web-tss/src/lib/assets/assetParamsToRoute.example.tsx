import { type Navigate, UseNavigateResult, useNavigate } from '@tanstack/react-router';
import type { FileRouteTypes } from '@/routeTree.gen';
import { assetParamsToRoute, createRouteBuilder } from './assetParamsToRoute';

/**
 * Example usage of assetParamsToRoute
 *
 * Note: These examples show how to get the correct route paths.
 * For actual navigation, you would use these routes with your router's navigation API.
 */

// Example 1: Get route for a single asset
export function getSingleAssetRoutes() {
  // Chat route
  const chatRoute = assetParamsToRoute({
    assetType: 'chat',
    assetId: 'chat-123',
  });
  console.log(chatRoute); // '/app/chats/$chatId'

  // Dashboard route
  const dashboardRoute = assetParamsToRoute({
    assetType: 'dashboard',
    assetId: 'dash-123',
  });
  console.log(dashboardRoute); // '/app/dashboards/$dashboardId'

  // Metric route
  const metricRoute = assetParamsToRoute({
    assetType: 'metric',
    assetId: 'metric-123',
  });
  console.log(metricRoute); // '/app/metrics/$metricId'

  // Report route
  const reportRoute = assetParamsToRoute({
    assetType: 'report',
    assetId: 'report-123',
  });
  console.log(reportRoute); // '/app/reports/$reportId'
}

// Example 2: Get routes for assets within chat context
export function getChatContextRoutes() {
  // Metric within a chat
  const metricInChat = assetParamsToRoute({
    assetType: 'metric',
    assetId: 'metric-123',
    chatId: 'chat-456',
  });
  console.log(metricInChat); // '/app/chats/$chatId/metrics/$metricId'

  // Dashboard within a chat
  const dashboardInChat = assetParamsToRoute({
    assetType: 'dashboard',
    assetId: 'dash-123',
    chatId: 'chat-456',
  });
  console.log(dashboardInChat); // '/app/chats/$chatId/dashboard/$dashboardId'

  // Report within a chat
  const reportInChat = assetParamsToRoute({
    assetType: 'report',
    assetId: 'report-123',
    chatId: 'chat-456',
  });
  console.log(reportInChat); // '/app/chats/$chatId/report/$reportId'
}

// Example 3: Get routes for nested contexts
export function getNestedContextRoutes() {
  // Metric within a dashboard within a chat
  const metricInDashboardInChat = assetParamsToRoute({
    assetType: 'metric',
    assetId: 'metric-123',
    chatId: 'chat-456',
    dashboardId: 'dash-789',
  });
  console.log(metricInDashboardInChat); // '/app/chats/$chatId/dashboard/$dashboardId/metrics/$metricId'

  // Metric within a report within a chat
  const metricInReportInChat = assetParamsToRoute({
    assetType: 'metric',
    assetId: 'metric-123',
    chatId: 'chat-456',
    reportId: 'report-789',
  });
  console.log(metricInReportInChat); // '/app/chats/$chatId/report/$reportId/metrics/$metricId'
}

// Example 4: Using the RouteBuilder for more control
export function usingRouteBuilder() {
  // Build a route step by step
  const route1 = createRouteBuilder().withChat('chat-123').withMetric('metric-456').build();
  console.log(route1); // '/app/chats/$chatId/metrics/$metricId'

  // Get the params for navigation
  const builder = createRouteBuilder()
    .withChat('chat-123')
    .withDashboard('dash-456')
    .withMetric('metric-789');

  const route = builder.build();
  const params = builder.getParams();
  console.log(route); // '/app/chats/$chatId/dashboard/$dashboardId/metrics/$metricId'
  console.log(params); // { chatId: 'chat-123', dashboardId: 'dash-456', metricId: 'metric-789' }
}

// Example 5: Type-safe route generation
export function typeSafeRoutes() {
  // All of these return type-safe FileRouteTypes['id'] values
  const routes: FileRouteTypes['id'][] = [
    assetParamsToRoute({ assetType: 'chat', assetId: '1' }),
    assetParamsToRoute({ assetType: 'dashboard', assetId: '2' }),
    assetParamsToRoute({ assetType: 'metric', assetId: '3' }),
    assetParamsToRoute({ assetType: 'report', assetId: '4' }),
    assetParamsToRoute({ assetType: 'metric', assetId: '5', chatId: '1' }),
    assetParamsToRoute({ assetType: 'dashboard', assetId: '6', chatId: '1' }),
    assetParamsToRoute({ assetType: 'dashboard', assetId: '7', chatId: '1', metricId: '5' }),
  ];

  return routes;
}

// Example 6: Helper function for navigation params
export function getNavigationParams(params: Parameters<typeof assetParamsToRoute>[0]) {
  const route = assetParamsToRoute(params);

  // Build the params object for navigation
  const navParams: Record<string, string> = {};

  // Add the main asset ID
  switch (params.assetType) {
    case 'chat':
      navParams.chatId = params.assetId;
      break;
    case 'metric':
      navParams.metricId = params.assetId;
      break;
    case 'dashboard':
      navParams.dashboardId = params.assetId;
      break;
    case 'report':
      navParams.reportId = params.assetId;
      break;
  }

  // Add any context params
  if ('chatId' in params && params.chatId) navParams.chatId = params.chatId;
  if ('metricId' in params && params.metricId) navParams.metricId = params.metricId;
  if ('dashboardId' in params && params.dashboardId) navParams.dashboardId = params.dashboardId;
  if ('reportId' in params && params.reportId) navParams.reportId = params.reportId;

  return { route, params: navParams };
}

/**
 * Example: Creating links with proper type safety
 */
export function LinkExample() {
  // All of these will be type-safe RouteFilePaths
  const routes = {
    chat: assetParamsToRoute({ assetType: 'chat', assetId: 'chat-123' }),
    metric: assetParamsToRoute({ assetType: 'metric', assetId: 'metric-123' }),
    dashboard: assetParamsToRoute({ assetType: 'dashboard', assetId: 'dash-123' }),
    report: assetParamsToRoute({ assetType: 'report', assetId: 'report-123' }),

    // Complex routes
    chatWithMetric: assetParamsToRoute({
      assetType: 'chat',
      assetId: 'chat-123',
      metricId: 'metric-456',
    }),

    dashboardInChat: assetParamsToRoute({
      assetType: 'dashboard',
      assetId: 'dash-123',
      chatId: 'chat-456',
    }),

    fullRoute: assetParamsToRoute({
      assetType: 'dashboard',
      assetId: 'dash-123',
      chatId: 'chat-456',
      metricId: 'metric-789',
    }),
  };

  return (
    <nav>
      {Object.entries(routes).map(([key, route]) => (
        <a key={key} href={route}>
          {key}: {route}
        </a>
      ))}
    </nav>
  );
}

/**
 * Example: Helper for creating asset navigation data
 *
 * This would be used with your router's navigation API.
 * For example, with TanStack Router:
 * const { route, params } = createAssetNavigation({...});
 * navigate({ to: route, params });
 */
export function createAssetNavigation(params: Parameters<typeof assetParamsToRoute>[0]) {
  const route = assetParamsToRoute(params);

  // Build navigation params based on the route
  const navParams: Record<string, string> = {};

  // Always include the main asset ID with its proper param name
  switch (params.assetType) {
    case 'chat':
      navParams.chatId = params.assetId;
      break;
    case 'metric':
      navParams.metricId = params.assetId;
      break;
    case 'dashboard':
      navParams.dashboardId = params.assetId;
      break;
    case 'report':
      navParams.reportId = params.assetId;
      break;
  }

  // Add any additional context params
  if ('chatId' in params && params.chatId) navParams.chatId = params.chatId;
  if ('metricId' in params && params.metricId) navParams.metricId = params.metricId;
  if ('dashboardId' in params && params.dashboardId) navParams.dashboardId = params.dashboardId;
  if ('reportId' in params && params.reportId) navParams.reportId = params.reportId;

  return {
    route,
    params: navParams,
    // Helper methods
    assetParamsToRoute,
    createRouteBuilder,
  };
}

export const TestComponent = () => {
  const navigate = useNavigate();

  const test = (params: Parameters<typeof Navigate>[0]) => {
    console.log(params);
  };

  test({
    to: '/asdf',
  });

  navigate({
    to: '/app/chats/$chatId',
    params: {
      chatId: '123',
    },
  });

  return <div></div>;
};
