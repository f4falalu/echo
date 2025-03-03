import { BusterRoutes, createBusterRoute } from './busterRoutes';

export const pathNameToRoute = (pathName: string, params: any): BusterRoutes => {
  const route = Object.values(BusterRoutes).find((r) => {
    return r === pathName || createBusterRoute({ route: r, ...params }) === pathName;
  });

  const paramRoutesToParent: Record<string, BusterRoutes> = {
    [BusterRoutes.APP_METRIC_ID]: BusterRoutes.APP_METRIC,
    [BusterRoutes.APP_DASHBOARD_METRICS_ID]: BusterRoutes.APP_DASHBOARDS,
    [BusterRoutes.APP_DASHBOARD_ID]: BusterRoutes.APP_DASHBOARDS,
    [BusterRoutes.APP_COLLECTIONS_ID]: BusterRoutes.APP_COLLECTIONS,
    [BusterRoutes.APP_DATASETS_ID]: BusterRoutes.APP_DATASETS,
    [BusterRoutes.APP_DATASETS_ID_PERMISSIONS_OVERVIEW]: BusterRoutes.APP_DATASETS,
    [BusterRoutes.APP_DATASETS_ID_OVERVIEW]: BusterRoutes.APP_DATASETS,
    [BusterRoutes.APP_DATASETS_ID_EDITOR]: BusterRoutes.APP_DATASETS,
    [BusterRoutes.APP_TERMS_ID]: BusterRoutes.APP_TERMS,
    [BusterRoutes.SETTINGS_USERS_ID]: BusterRoutes.SETTINGS_USERS
  };
  if (route && paramRoutesToParent[route as string]) {
    return paramRoutesToParent[route as string];
  }

  return route || BusterRoutes.ROOT;
};
