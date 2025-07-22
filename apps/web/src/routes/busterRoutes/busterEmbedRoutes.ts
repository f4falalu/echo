export enum BusterEmbedRoutes {
  EMBED_METRIC_ID = '/embed/metrics/:metricId',
  EMBED_DASHBOARD_ID = '/embed/dashboards/:dashboardId',
  EMBED_COLLECTION_ID = '/embed/collections/:collectionId'
}

export type BusterEmbedRoutesWithArgs = {
  [BusterEmbedRoutes.EMBED_METRIC_ID]: {
    route: BusterEmbedRoutes.EMBED_METRIC_ID;
    metricId: string;
  };
  [BusterEmbedRoutes.EMBED_DASHBOARD_ID]: {
    route: BusterEmbedRoutes.EMBED_DASHBOARD_ID;
    dashboardId: string;
  };
  [BusterEmbedRoutes.EMBED_COLLECTION_ID]: {
    route: BusterEmbedRoutes.EMBED_COLLECTION_ID;
    collectionId: string;
  };
};
