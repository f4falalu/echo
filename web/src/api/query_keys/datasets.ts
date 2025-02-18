'use client';

import { queryOptions } from '@tanstack/react-query';
import type { BusterDataset, BusterDatasetListItem, IDataResult } from '../asset_interfaces';
import type { GetDatasetsParams } from '../request_interfaces/dataset';

const datasetsList = (params?: GetDatasetsParams) =>
  queryOptions<BusterDatasetListItem[]>({
    queryKey: ['datasets', params]
  });

const datasetData = (datasetId: string) =>
  queryOptions<IDataResult>({
    queryKey: ['datasetData', datasetId]
  });

const datasetMetadata = (datasetId: string) =>
  queryOptions<BusterDataset>({
    queryKey: ['datasetMetadata', datasetId],
    staleTime: 10 * 1000
  });

export const datasetQueryKeys = {
  datasetsList,
  datasetData,
  datasetMetadata
};
