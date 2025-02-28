'use client';

import React, { useMemo, useState } from 'react';
import { Breadcrumb, Button } from 'antd';
import Link from 'next/link';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { AppMaterialIcons, AppSegmented, AppTooltip } from '@/components/ui';
import { NewDatasetModal } from '@/components/features/Modals/NewDatasetModal';
import { AppContentHeader } from '@/components/ui/layout/AppContentHeader';
import { useIndividualDataset } from '@/context/Datasets';
import { useHotkeys } from 'react-hotkeys-hook';
import { useUserConfigContextSelector } from '@/context/Users';
import { useMemoizedFn } from 'ahooks';

export const DatasetHeader: React.FC<{
  datasetFilter: 'all' | 'published' | 'drafts';
  setDatasetFilter: (filter: 'all' | 'published' | 'drafts') => void;
  datasetId?: string;
  setOpenNewDatasetModal: (open: boolean) => void;
  openNewDatasetModal: boolean;
}> = React.memo(
  ({ datasetFilter, setDatasetFilter, datasetId, setOpenNewDatasetModal, openNewDatasetModal }) => {
    const isAdmin = useUserConfigContextSelector((state) => state.isAdmin);
    const { dataset } = useIndividualDataset({ datasetId: datasetId || '' });
    const datasetTitle = dataset?.data?.name || 'Datasets';

    const breadcrumbItems = useMemo(
      () =>
        [
          {
            title: (
              <Link
                suppressHydrationWarning
                href={
                  datasetId
                    ? createBusterRoute({
                        route: BusterRoutes.APP_DATASETS_ID_OVERVIEW,
                        datasetId: datasetId
                      })
                    : createBusterRoute({ route: BusterRoutes.APP_DATASETS })
                }>
                {datasetTitle}
              </Link>
            )
          }
        ].filter((item) => item.title),
      [datasetId, datasetTitle]
    );

    const onCloseNewDatasetModal = useMemoizedFn(() => {
      setOpenNewDatasetModal(false);
    });

    const onOpenNewDatasetModal = useMemoizedFn(() => {
      setOpenNewDatasetModal(true);
    });

    useHotkeys('d', onOpenNewDatasetModal);

    return (
      <>
        <AppContentHeader className="items-center justify-between space-x-2">
          <div className="flex space-x-3">
            <Breadcrumb className="flex items-center" items={breadcrumbItems} />
            <DatasetFilters datasetFilter={datasetFilter} setDatasetFilter={setDatasetFilter} />
          </div>

          <div className="flex items-center">
            {isAdmin && (
              <AppTooltip title={'Create new dashboard'} shortcuts={['D']}>
                <Button
                  type="default"
                  icon={<AppMaterialIcons icon="add" />}
                  onClick={onOpenNewDatasetModal}>
                  New Dataset
                </Button>
              </AppTooltip>
            )}
          </div>
        </AppContentHeader>

        {isAdmin && <NewDatasetModal open={openNewDatasetModal} onClose={onCloseNewDatasetModal} />}
      </>
    );
  }
);
DatasetHeader.displayName = 'DatasetHeader';

const DatasetFilters: React.FC<{
  datasetFilter: 'all' | 'published' | 'drafts';
  setDatasetFilter: (filter: 'all' | 'published' | 'drafts') => void;
}> = ({ datasetFilter, setDatasetFilter }) => {
  const options: { label: string; value: 'all' | 'published' | 'drafts' }[] = useMemo(
    () => [
      { label: 'All', value: 'all' },
      { label: 'Published', value: 'published' },
      { label: 'Drafts', value: 'drafts' }
    ],
    []
  );

  return (
    <AppSegmented
      options={options}
      value={datasetFilter}
      onChange={(value) => {
        setDatasetFilter(value as 'all' | 'published' | 'drafts');
      }}
    />
  );
};
