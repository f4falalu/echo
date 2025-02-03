'use server';

import * as config from './config';
import { serverFetch } from '../../../createServerInstance';
import type { DatasetPermissionsOverviewResponse } from '../../../asset_interfaces';

export const getDatasetPermissionsOverview_server = async (datasetId: string) => {
  const response = await serverFetch<DatasetPermissionsOverviewResponse>(
    config.GET_PERMISSIONS_OVERVIEW(datasetId)
  );
  return response;
};
