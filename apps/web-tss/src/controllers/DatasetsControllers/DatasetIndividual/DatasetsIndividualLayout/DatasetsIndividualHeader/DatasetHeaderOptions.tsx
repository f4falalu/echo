import { type RegisteredRouter, useNavigate } from '@tanstack/react-router';
import React, { useMemo } from 'react';
import { AppSegmented, createSegmentedItem, type SegmentedItem } from '@/components/ui/segmented';
import { defineLink } from '@/lib/routes';
import { DataSetAppText, DatasetApps } from '../config';

export const DatasetsHeaderOptions: React.FC<{
  selectedApp: DatasetApps;
  isAdmin: boolean;
  datasetId: string | undefined;
}> = React.memo(({ datasetId, isAdmin, selectedApp }) => {
  const optionsItems = useMemo(
    () =>
      isAdmin
        ? [DatasetApps.OVERVIEW, DatasetApps.PERMISSIONS, DatasetApps.EDITOR]
        : [DatasetApps.OVERVIEW, DatasetApps.PERMISSIONS],
    [isAdmin]
  );

  const createDatasetSegmentedItem = createSegmentedItem<DatasetApps>();
  const options: SegmentedItem<DatasetApps>[] = useMemo(
    () =>
      optionsItems.map((key) =>
        createDatasetSegmentedItem({
          label: DataSetAppText[key as DatasetApps],
          value: key,
          link: datasetId ? keyToRoute(datasetId, key) : undefined,
        })
      ),
    [datasetId, optionsItems]
  );

  return <AppSegmented type="button" options={options} value={selectedApp} />;
});
DatasetsHeaderOptions.displayName = 'DatasetsHeaderOptions';

const keyToRoute = <TRouter extends RegisteredRouter, TOptions, TFrom extends string = string>(
  datasetId: string,
  key: DatasetApps
) => {
  if (key === DatasetApps.OVERVIEW) {
    return defineLink({
      to: `/app/datasets/$datasetId/overview`,
      params: {
        datasetId,
      },
    });
  }
  if (key === DatasetApps.EDITOR) {
    return defineLink({
      to: `/app/datasets/$datasetId/editor`,
      params: {
        datasetId,
      },
    });
  }

  const _exhaustiveCheck: DatasetApps.PERMISSIONS = key;

  return defineLink({
    to: `/app/datasets/$datasetId/permissions`,
    params: {
      datasetId,
    },
  });
};
