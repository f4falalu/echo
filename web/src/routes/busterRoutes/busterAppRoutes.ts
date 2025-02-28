export enum BusterAppRoutes {
  APP_ROOT = '/app',
  APP_HOME = '/app/home',
  APP_COLLECTIONS = '/app/collections',
  APP_COLLECTIONS_ID = '/app/collections/:collectionId',
  APP_COLLECTIONS_ID_METRICS_ID = '/app/collections/:collectionId/metrics/:metricId',
  APP_METRIC = '/app/metrics',
  APP_METRIC_ID = '/app/metrics/:metricId',
  APP_DASHBOARDS = '/app/dashboards',
  APP_DASHBOARD_ID = '/app/dashboards/:dashboardId',
  APP_DASHBOARD_METRICS = '/app/dashboards/:dashboardId/metrics',
  APP_DASHBOARD_METRICS_ID = '/app/dashboards/:dashboardId/metrics/:metricId',
  APP_LOGS = '/app/logs',
  APP_DATASETS = '/app/datasets',
  APP_DATASETS_ID = '/app/datasets/:datasetId',

  APP_DATASETS_ID_OVERVIEW = '/app/datasets/:datasetId/overview',
  APP_DATASETS_ID_PERMISSIONS_OVERVIEW = '/app/datasets/:datasetId/permissions/overview',
  APP_DATASETS_ID_PERMISSIONS_PERMISSION_GROUPS = '/app/datasets/:datasetId/permissions/permission-groups',
  APP_DATASETS_ID_PERMISSIONS_USERS = '/app/datasets/:datasetId/permissions/users',
  APP_DATASETS_ID_PERMISSIONS_DATASET_GROUPS = '/app/datasets/:datasetId/permissions/dataset-groups',
  APP_DATASETS_ID_EDITOR = '/app/datasets/:datasetId/editor',
  APP_TERMS = '/app/terms',
  APP_TERMS_ID = '/app/terms/:termId',

  //NEW CHAT
  APP_CHAT = '/app/chats',
  APP_CHAT_ID = '/app/chats/:chatId',
  APP_CHAT_ID_REASONING_ID = '/app/chats/:chatId/reasoning/:messageId',
  APP_CHAT_ID_METRIC_ID = '/app/chats/:chatId/metric/:metricId',
  APP_CHAT_ID_COLLECTION_ID = '/app/chats/:chatId/collection/:collectionId',
  APP_CHAT_ID_DASHBOARD_ID = '/app/chats/:chatId/dashboard/:dashboardId',
  APP_CHAT_ID_DATASET_ID = '/app/chats/:chatId/dataset/:datasetId',
  APP_CHAT_ID_TERM_ID = '/app/chats/:chatId/term/:termId',
  APP_CHAT_ID_VALUE_ID = '/app/chats/:chatId/value/:valueId',
  APP_VALUE_ID = '/app/value/:valueId',

  APP_SETTINGS = '/app/settings',
  APP_SETTINGS_PERMISSIONS = '/app/settings/permissions',
  APP_SETTINGS_STORAGE = '/app/settings/storage',
  APP_SETTINGS_DATASOURCES = '/app/settings/datasources',
  APP_SETTINGS_DATASOURCES_ID = '/app/settings/datasources/:datasourceId',
  APP_SETTINGS_DATASOURCES_ADD = '/app/settings/datasources/add',
  APP_SETTINGS_INTEGRATIONS = '/app/settings/integrations',
  APP_SETTINGS_PERMISSION_GROUPS = '/app/settings/permission-groups',
  APP_SETTINGS_PERMISSION_GROUPS_ID_USERS = '/app/settings/permission-groups/:permissionGroupId/users',
  APP_SETTINGS_PERMISSION_GROUPS_ID_DATASET_GROUPS = '/app/settings/permission-groups/:permissionGroupId/dataset-groups',
  APP_SETTINGS_PERMISSION_GROUPS_ID_DATASETS = '/app/settings/permission-groups/:permissionGroupId/datasets',
  APP_SETTINGS_API_KEYS = '/app/settings/api-keys',
  APP_SETTINGS_EMBEDS = '/app/settings/embeds',
  APP_SETTINGS_BILLING = '/app/settings/billing',
  APP_SETTINGS_PROFILE = '/app/settings/profile',
  APP_SETTINGS_PREFERENCES = '/app/settings/preferences',
  APP_SETTINGS_NOTIFICATIONS = '/app/settings/notifications',
  APP_SETTINGS_TEAM_ID = '/app/settings/team/:teamId',
  APP_SETTINGS_USERS = '/app/settings/users',
  APP_SETTINGS_USERS_ID = '/app/settings/users/:userId',
  APP_SETTINGS_USERS_ID_PERMISSION_GROUPS = '/app/settings/users/:userId/permission-groups',
  APP_SETTINGS_USERS_ID_ATTRIBUTES = '/app/settings/users/:userId/attributes',
  APP_SETTINGS_USERS_ID_DATASETS = '/app/settings/users/:userId/datasets',
  APP_SETTINGS_USERS_ID_DATASET_GROUPS = '/app/settings/users/:userId/dataset-groups',
  APP_SETTINGS_USERS_ID_TEAMS = '/app/settings/users/:userId/teams',
  APP_SETTINGS_DATASETS_ID = '/app/settings/datasets/:datasetId',
  APP_SETTINGS_DATASET_GROUPS = '/app/settings/dataset-groups',
  APP_SETTINGS_DATASET_GROUPS_ID_PERMISSION_GROUPS = '/app/settings/dataset-groups/:datasetGroupId/permission-groups',
  APP_SETTINGS_DATASET_GROUPS_ID_DATASETS = '/app/settings/dataset-groups/:datasetGroupId/datasets',
  APP_SETTINGS_DATASET_GROUPS_ID_USERS = '/app/settings/dataset-groups/:datasetGroupId/users',
  APP_SETTINGS_ATTRIBUTES = '/app/settings/attributes',
  APP_SETTINGS_SECURITY = '/app/settings/security',
  NEW_USER = '/app/new-user'
}

export type BusterAppRoutesWithArgs = {
  [BusterAppRoutes.APP_ROOT]: { route: BusterAppRoutes.APP_ROOT };
  [BusterAppRoutes.APP_HOME]: { route: BusterAppRoutes.APP_HOME };
  [BusterAppRoutes.APP_COLLECTIONS]: { route: BusterAppRoutes.APP_COLLECTIONS };
  [BusterAppRoutes.APP_COLLECTIONS_ID]: {
    route: BusterAppRoutes.APP_COLLECTIONS_ID;
    collectionId: string;
  };
  [BusterAppRoutes.APP_METRIC]: { route: BusterAppRoutes.APP_METRIC };
  [BusterAppRoutes.APP_METRIC_ID]: { route: BusterAppRoutes.APP_METRIC_ID; metricId: string };
  [BusterAppRoutes.APP_DASHBOARDS]: { route: BusterAppRoutes.APP_DASHBOARDS };
  [BusterAppRoutes.APP_DASHBOARD_ID]: {
    route: BusterAppRoutes.APP_DASHBOARD_ID;
    dashboardId: string;
  };
  [BusterAppRoutes.APP_DASHBOARD_METRICS]: {
    route: BusterAppRoutes.APP_DASHBOARD_METRICS;
    dashboardId: string;
  };
  [BusterAppRoutes.APP_DASHBOARD_METRICS_ID]: {
    route: BusterAppRoutes.APP_DASHBOARD_METRICS_ID;
    dashboardId: string;
    metricId: string;
  };
  [BusterAppRoutes.APP_DATASETS]: { route: BusterAppRoutes.APP_DATASETS };
  [BusterAppRoutes.APP_TERMS]: { route: BusterAppRoutes.APP_TERMS };
  [BusterAppRoutes.APP_SETTINGS]: { route: BusterAppRoutes.APP_SETTINGS };
  [BusterAppRoutes.APP_SETTINGS_PERMISSIONS]: { route: BusterAppRoutes.APP_SETTINGS_PERMISSIONS };
  [BusterAppRoutes.APP_SETTINGS_STORAGE]: { route: BusterAppRoutes.APP_SETTINGS_STORAGE };
  [BusterAppRoutes.APP_SETTINGS_DATASOURCES]: { route: BusterAppRoutes.APP_SETTINGS_DATASOURCES };
  [BusterAppRoutes.APP_SETTINGS_INTEGRATIONS]: { route: BusterAppRoutes.APP_SETTINGS_INTEGRATIONS };
  [BusterAppRoutes.APP_SETTINGS_PERMISSION_GROUPS]: {
    route: BusterAppRoutes.APP_SETTINGS_PERMISSION_GROUPS;
  };
  [BusterAppRoutes.APP_SETTINGS_PERMISSION_GROUPS_ID_USERS]: {
    route: BusterAppRoutes.APP_SETTINGS_PERMISSION_GROUPS_ID_USERS;
    permissionGroupId: string;
  };
  [BusterAppRoutes.APP_SETTINGS_PERMISSION_GROUPS_ID_DATASET_GROUPS]: {
    route: BusterAppRoutes.APP_SETTINGS_PERMISSION_GROUPS_ID_DATASET_GROUPS;
    permissionGroupId: string;
  };
  [BusterAppRoutes.APP_SETTINGS_PERMISSION_GROUPS_ID_DATASETS]: {
    route: BusterAppRoutes.APP_SETTINGS_PERMISSION_GROUPS_ID_DATASETS;
    permissionGroupId: string;
  };
  [BusterAppRoutes.APP_SETTINGS_API_KEYS]: { route: BusterAppRoutes.APP_SETTINGS_API_KEYS };
  [BusterAppRoutes.APP_SETTINGS_EMBEDS]: { route: BusterAppRoutes.APP_SETTINGS_EMBEDS };
  [BusterAppRoutes.APP_SETTINGS_BILLING]: { route: BusterAppRoutes.APP_SETTINGS_BILLING };
  [BusterAppRoutes.APP_SETTINGS_PROFILE]: { route: BusterAppRoutes.APP_SETTINGS_PROFILE };
  [BusterAppRoutes.APP_SETTINGS_PREFERENCES]: { route: BusterAppRoutes.APP_SETTINGS_PREFERENCES };
  [BusterAppRoutes.APP_SETTINGS_NOTIFICATIONS]: {
    route: BusterAppRoutes.APP_SETTINGS_NOTIFICATIONS;
  };
  [BusterAppRoutes.APP_SETTINGS_TEAM_ID]: {
    route: BusterAppRoutes.APP_SETTINGS_TEAM_ID;
    teamId: string;
  };
  [BusterAppRoutes.APP_SETTINGS_DATASOURCES_ID]: {
    route: BusterAppRoutes.APP_SETTINGS_DATASOURCES_ID;
    datasourceId: string;
  };
  [BusterAppRoutes.APP_SETTINGS_DATASOURCES_ADD]: {
    route: BusterAppRoutes.APP_SETTINGS_DATASOURCES_ADD;
  };
  [BusterAppRoutes.APP_DATASETS_ID]: { route: BusterAppRoutes.APP_DATASETS_ID; datasetId: string };
  [BusterAppRoutes.APP_LOGS]: { route: BusterAppRoutes.APP_LOGS };
  [BusterAppRoutes.APP_TERMS_ID]: { route: BusterAppRoutes.APP_TERMS_ID; termId: string };
  [BusterAppRoutes.APP_DATASETS_ID_OVERVIEW]: {
    route: BusterAppRoutes.APP_DATASETS_ID_OVERVIEW;
    datasetId: string;
  };
  [BusterAppRoutes.APP_DATASETS_ID_PERMISSIONS_OVERVIEW]: {
    route: BusterAppRoutes.APP_DATASETS_ID_PERMISSIONS_OVERVIEW;
    datasetId: string;
  };
  [BusterAppRoutes.APP_DATASETS_ID_PERMISSIONS_PERMISSION_GROUPS]: {
    route: BusterAppRoutes.APP_DATASETS_ID_PERMISSIONS_PERMISSION_GROUPS;
    datasetId: string;
  };
  [BusterAppRoutes.APP_DATASETS_ID_PERMISSIONS_USERS]: {
    route: BusterAppRoutes.APP_DATASETS_ID_PERMISSIONS_USERS;
    datasetId: string;
  };
  [BusterAppRoutes.APP_DATASETS_ID_PERMISSIONS_DATASET_GROUPS]: {
    route: BusterAppRoutes.APP_DATASETS_ID_PERMISSIONS_DATASET_GROUPS;
    datasetId: string;
  };
  [BusterAppRoutes.APP_DATASETS_ID_EDITOR]: {
    route: BusterAppRoutes.APP_DATASETS_ID_EDITOR;
    datasetId: string;
  };
  [BusterAppRoutes.APP_COLLECTIONS_ID_METRICS_ID]: {
    route: BusterAppRoutes.APP_COLLECTIONS_ID_METRICS_ID;
    collectionId: string;
    metricId: string;
  };
  [BusterAppRoutes.NEW_USER]: { route: BusterAppRoutes.NEW_USER };
  [BusterAppRoutes.APP_SETTINGS_USERS]: { route: BusterAppRoutes.APP_SETTINGS_USERS };
  [BusterAppRoutes.APP_SETTINGS_USERS_ID]: {
    route: BusterAppRoutes.APP_SETTINGS_USERS_ID;
    userId: string;
  };
  [BusterAppRoutes.APP_SETTINGS_USERS_ID_PERMISSION_GROUPS]: {
    route: BusterAppRoutes.APP_SETTINGS_USERS_ID_PERMISSION_GROUPS;
    userId: string;
  };
  [BusterAppRoutes.APP_SETTINGS_USERS_ID_ATTRIBUTES]: {
    route: BusterAppRoutes.APP_SETTINGS_USERS_ID_ATTRIBUTES;
    userId: string;
  };
  [BusterAppRoutes.APP_SETTINGS_USERS_ID_DATASETS]: {
    route: BusterAppRoutes.APP_SETTINGS_USERS_ID_DATASETS;
    userId: string;
  };
  [BusterAppRoutes.APP_SETTINGS_USERS_ID_DATASET_GROUPS]: {
    route: BusterAppRoutes.APP_SETTINGS_USERS_ID_DATASET_GROUPS;
    userId: string;
  };
  [BusterAppRoutes.APP_SETTINGS_USERS_ID_TEAMS]: {
    route: BusterAppRoutes.APP_SETTINGS_USERS_ID_TEAMS;
    userId: string;
  };
  [BusterAppRoutes.APP_SETTINGS_DATASETS_ID]: {
    route: BusterAppRoutes.APP_SETTINGS_DATASETS_ID;
    datasetId: string;
  };
  [BusterAppRoutes.APP_SETTINGS_DATASET_GROUPS]: {
    route: BusterAppRoutes.APP_SETTINGS_DATASET_GROUPS;
  };
  [BusterAppRoutes.APP_SETTINGS_DATASET_GROUPS_ID_PERMISSION_GROUPS]: {
    route: BusterAppRoutes.APP_SETTINGS_DATASET_GROUPS_ID_PERMISSION_GROUPS;
    datasetGroupId: string;
  };
  [BusterAppRoutes.APP_SETTINGS_DATASET_GROUPS_ID_DATASETS]: {
    route: BusterAppRoutes.APP_SETTINGS_DATASET_GROUPS_ID_DATASETS;
    datasetGroupId: string;
  };
  [BusterAppRoutes.APP_SETTINGS_DATASET_GROUPS_ID_USERS]: {
    route: BusterAppRoutes.APP_SETTINGS_DATASET_GROUPS_ID_USERS;
    datasetGroupId: string;
  };
  [BusterAppRoutes.APP_SETTINGS_ATTRIBUTES]: { route: BusterAppRoutes.APP_SETTINGS_ATTRIBUTES };
  [BusterAppRoutes.APP_SETTINGS_SECURITY]: { route: BusterAppRoutes.APP_SETTINGS_SECURITY };
  [BusterAppRoutes.APP_CHAT]: { route: BusterAppRoutes.APP_CHAT };
  [BusterAppRoutes.APP_CHAT_ID]: { route: BusterAppRoutes.APP_CHAT_ID; chatId: string };
  [BusterAppRoutes.APP_CHAT_ID_REASONING_ID]: {
    route: BusterAppRoutes.APP_CHAT_ID_REASONING_ID;
    chatId: string;
    messageId: string;
  };
  [BusterAppRoutes.APP_CHAT_ID_METRIC_ID]: {
    route: BusterAppRoutes.APP_CHAT_ID_METRIC_ID;
    chatId: string;
    metricId: string;
  };
  [BusterAppRoutes.APP_CHAT_ID_COLLECTION_ID]: {
    route: BusterAppRoutes.APP_CHAT_ID_COLLECTION_ID;
    chatId: string;
    collectionId: string;
  };
  [BusterAppRoutes.APP_CHAT_ID_DASHBOARD_ID]: {
    route: BusterAppRoutes.APP_CHAT_ID_DASHBOARD_ID;
    chatId: string;
    dashboardId: string;
  };
  [BusterAppRoutes.APP_CHAT_ID_DATASET_ID]: {
    route: BusterAppRoutes.APP_CHAT_ID_DATASET_ID;
    chatId: string;
    datasetId: string;
  };
  [BusterAppRoutes.APP_CHAT_ID_TERM_ID]: {
    route: BusterAppRoutes.APP_CHAT_ID_TERM_ID;
    chatId: string;
    termId: string;
  };
  [BusterAppRoutes.APP_CHAT_ID_VALUE_ID]: {
    route: BusterAppRoutes.APP_CHAT_ID_VALUE_ID;
    chatId: string;
    valueId: string;
  };
  [BusterAppRoutes.APP_METRIC_ID]: { route: BusterAppRoutes.APP_METRIC_ID; metricId: string };
  [BusterAppRoutes.APP_VALUE_ID]: { route: BusterAppRoutes.APP_VALUE_ID; valueId: string };
};
