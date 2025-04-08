import { createBusterRoute, createPathnameToBusterRoute } from './createRouteHelpers';
import { BusterAuthRoutes } from './busterAuthRoutes';
import { BusterAppRoutes } from './busterAppRoutes';
import { BusterSettingsRoutes } from './busterSettingsRoutes';
import { BusterRoutes } from './busterRoutes';

describe('createBusterRoute', () => {
  test('should return route as is when no parameters are provided', () => {
    const input = { route: BusterAuthRoutes.AUTH_LOGIN };
    const result = createBusterRoute(input);
    expect(result).toBe('/auth/login');
  });

  test('should replace single dynamic parameter in route', () => {
    const input = {
      route: BusterAppRoutes.APP_CHAT_ID,
      chatId: '123'
    } as const;
    const result = createBusterRoute(input);
    expect(result).toBe('/app/chats/123');
  });

  test('should replace multiple dynamic parameters in route', () => {
    const input = {
      route: BusterSettingsRoutes.SETTINGS_PERMISSION_GROUPS_ID_DATASETS,
      permissionGroupId: 'group123'
    } as const;
    const result = createBusterRoute(input);
    expect(result).toBe('/app/settings/permission-groups/group123/datasets');
  });

  test('should work with a dashboard version number', () => {
    const input = {
      route: BusterAppRoutes.APP_CHAT_ID_DASHBOARD_ID_VERSION_NUMBER,
      chatId: '123',
      dashboardId: '456',
      versionNumber: '1'
    } as const;
    const result = createBusterRoute(input);
    expect(result).toBe('/app/chats/123/dashboards/456?dashboard_version_number=1');
  });

  test('should handle multiple query parameters', () => {
    const input = {
      route: BusterAppRoutes.APP_METRIC_ID_VERSION_NUMBER,
      metricId: '789',
      versionNumber: '2'
    } as const;
    const result = createBusterRoute(input);
    expect(result).toBe('/app/metrics/789/chart?metric_version_number=2');
  });

  test('should handle query parameters with special characters', () => {
    const input = {
      route: BusterAppRoutes.APP_CHAT_ID_DASHBOARD_ID_VERSION_NUMBER,
      chatId: '123-abc',
      dashboardId: '456@test',
      versionNumber: '1.0.1'
    } as const;
    const result = createBusterRoute(input);
    expect(result).toBe('/app/chats/123-abc/dashboards/456@test?dashboard_version_number=1.0.1');
  });

  test('should handle routes with multiple path parameters but no query', () => {
    const input = {
      route: BusterAppRoutes.APP_CHAT_ID_METRIC_ID_CHART,
      chatId: 'chat123',
      metricId: 'metric456'
    } as const;
    const result = createBusterRoute(input);
    expect(result).toBe('/app/chats/chat123/metrics/metric456/chart');
  });

  test('should handle routes with nested path parameters', () => {
    const input = {
      route: BusterAppRoutes.APP_CHAT_ID_METRIC_ID_RESULTS,
      chatId: 'chat789',
      metricId: 'metric012'
    } as const;
    const result = createBusterRoute(input);
    expect(result).toBe('/app/chats/chat789/metrics/metric012/results');
  });

  test('should preserve path structure with multiple segments', () => {
    const input = {
      route: BusterAppRoutes.APP_DATASETS_ID_PERMISSIONS_OVERVIEW,
      datasetId: 'dataset123'
    } as const;
    const result = createBusterRoute(input);
    expect(result).toBe('/app/datasets/dataset123/permissions/overview');
  });
});

describe('createPathnameToBusterRoute', () => {
  test('should convert simple auth route pathname', () => {
    const pathname = '/auth/login';
    const result = createPathnameToBusterRoute(pathname);
    expect(result).toEqual(BusterAuthRoutes.AUTH_LOGIN);
  });

  test('should convert chat route with dynamic chatId', () => {
    const pathname = '/app/chats/123';
    const result = createPathnameToBusterRoute(pathname);
    expect(result).toEqual(BusterAppRoutes.APP_CHAT_ID);
  });

  test('should convert settings route with permission group id', () => {
    const pathname = '/app/settings/permission-groups/group123/datasets';
    const result = createPathnameToBusterRoute(pathname);
    expect(result).toEqual(BusterSettingsRoutes.SETTINGS_PERMISSION_GROUPS_ID_DATASETS);
  });

  test('should convert dataset route with ID', () => {
    const pathname = '/app/datasets/dataset123';
    const result = createPathnameToBusterRoute(pathname);
    expect(result).toEqual(BusterRoutes.APP_DATASETS_ID);
  });

  test('should convert dataset permissions route', () => {
    const pathname = '/app/datasets/dataset123/permissions/overview';
    const result = createPathnameToBusterRoute(pathname);
    expect(result).toEqual(BusterRoutes.APP_DATASETS_ID_PERMISSIONS_OVERVIEW);
  });

  test('should convert settings user route with nested path', () => {
    const pathname = '/app/settings/users/user123/permission-groups';
    const result = createPathnameToBusterRoute(pathname);
    expect(result).toEqual(BusterSettingsRoutes.SETTINGS_USERS_ID_PERMISSION_GROUPS);
  });

  test('should fallback to ROOT for unmatched routes', () => {
    const pathname = '/invalid/route/path';
    const result = createPathnameToBusterRoute(pathname);
    expect(result).toEqual(BusterRoutes.ROOT);
  });
});
