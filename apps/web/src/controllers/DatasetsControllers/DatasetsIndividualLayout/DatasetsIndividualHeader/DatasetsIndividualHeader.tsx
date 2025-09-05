import { useMatchRoute } from '@tanstack/react-router';
import React, {} from 'react';
import { useIsUserAdmin } from '@/api/buster_rest/users/useGetUserInfo';
import { Button } from '@/components/ui/buttons';
import { Separator } from '@/components/ui/separator';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { DatasetApps } from '../config';
import {
  useGetDatasetPageDataset,
  useGetDatasetPageDatasetId,
  useGetDatasetPageIsChangedSQL,
  useGetDatasetPageResetDataset,
  useGetDatasetPublishStatus,
  usePublishDataset,
} from '../DatasetPageContext';
import { DatasetBreadcrumb } from './DatasetBreadcrumb';
import { DatasetsHeaderOptions } from './DatasetHeaderOptions';
import { DatasetIndividualThreeDotMenu } from './DatasetIndividualThreeDotMenu';
import { useDatasetBlocker } from './useDatasetBlocker';

export const DatasetsIndividualHeader: React.FC = React.memo(() => {
  const selectedApp = useSelectedApp();
  const dataset = useGetDatasetPageDataset();
  const { onPublishDataset, isDeployingDataset } = usePublishDataset();
  const resetDataset = useGetDatasetPageResetDataset();
  const disablePublish = useGetDatasetPublishStatus();
  const isChangedSQL = useGetDatasetPageIsChangedSQL();
  const datasetId = useGetDatasetPageDatasetId();

  const datasetName = dataset?.data?.name;

  const isAdmin = useIsUserAdmin();

  const onReset = useMemoizedFn(() => {
    resetDataset();
  });

  useDatasetBlocker({ disablePublish, onPublishDataset, resetDataset });

  return (
    <>
      <div className="flex items-center space-x-3 overflow-hidden">
        <DatasetBreadcrumb datasetName={datasetName} />

        <DatasetsHeaderOptions isAdmin={isAdmin} selectedApp={selectedApp} datasetId={datasetId} />
      </div>

      <div className="flex items-center">
        <div className="flex items-center space-x-2">
          <DatasetIndividualThreeDotMenu datasetId={datasetId} />

          <Separator orientation="vertical" className="h-4!" />

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              onClick={onReset}
              disabled={!isChangedSQL || isDeployingDataset}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              disabled={disablePublish}
              onClick={onPublishDataset}
              loading={isDeployingDataset}
            >
              Publish
            </Button>
          </div>
        </div>
      </div>
    </>
  );
});

DatasetsIndividualHeader.displayName = 'DatasetsIndividualHeader';

const useSelectedApp = () => {
  const match = useMatchRoute();

  if (match({ from: '/app/datasets/$datasetId/overview' })) {
    return DatasetApps.OVERVIEW;
  }
  if (match({ from: '/app/datasets/$datasetId/permissions' })) {
    return DatasetApps.PERMISSIONS;
  }
  if (match({ from: '/app/datasets/$datasetId/editor' })) {
    return DatasetApps.EDITOR;
  }
  return DatasetApps.OVERVIEW;
};
