'use client';

import React, { useState, useMemo } from 'react';
import { AppContent } from '@/components/ui/layouts/AppContentPage';
import { Avatar } from '@/components/ui/avatar';
import { formatDate } from '@/lib';
import { BusterList, BusterListColumn, BusterListRow } from '@/components/ui/list';
import { BusterRoutes, createBusterRoute } from '@/routes';
import type { BusterDatasetListItem } from '@/api/asset_interfaces';
import { ListEmptyStateWithButton } from '@/components/ui/list';
import { useMemoizedFn } from 'ahooks';
import { DatasetSelectedOptionPopup } from './DatasetSelectedPopup';

const columns: BusterListColumn[] = [
  {
    title: 'Title',
    dataIndex: 'name'
  },
  {
    title: 'Last queried',
    dataIndex: 'updated_at',
    render: (v) => formatDate({ date: v, format: 'lll' }),
    width: 140
  },
  {
    title: 'Created at',
    dataIndex: 'created_at',
    render: (v) => formatDate({ date: v, format: 'lll' }),
    width: 140
  },
  {
    title: 'Data source',
    dataIndex: 'data_source.name',
    width: 105
  },
  {
    title: 'Status',
    dataIndex: 'enabled',
    width: 75,
    render: (_, record) => getStatusText(record as BusterDatasetListItem)
  },
  {
    title: 'Owner',
    dataIndex: 'created_by_name',
    width: 60,
    render: (_, dataset: BusterDatasetListItem) => (
      <div className="flex w-full justify-start">
        <Avatar image={dataset.owner.avatar_url || undefined} name={dataset.owner.name} size={18} />
      </div>
    )
  }
];

export const DatasetListContent: React.FC<{
  datasetsList: BusterDatasetListItem[];
  isFetchedDatasets: boolean;
  isAdmin: boolean;
  setOpenNewDatasetModal: (open: boolean) => void;
}> = React.memo(({ datasetsList, isFetchedDatasets, isAdmin, setOpenNewDatasetModal }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const rows: BusterListRow[] = useMemo(() => {
    return datasetsList.map((dataset) => {
      return {
        id: dataset.id,
        data: dataset,
        link: createBusterRoute({
          route: BusterRoutes.APP_DATASETS_ID_OVERVIEW,
          datasetId: dataset.id
        })
      };
    });
  }, [datasetsList]);

  const onClickEmptyState = useMemoizedFn(() => {
    setOpenNewDatasetModal(true);
  });

  return (
    <>
      <AppContent>
        <BusterList
          columns={columns}
          rows={rows}
          selectedRowKeys={selectedRowKeys}
          onSelectChange={setSelectedRowKeys}
          emptyState={
            !isFetchedDatasets ? (
              <></>
            ) : (
              <ListEmptyStateWithButton
                isAdmin={isAdmin}
                title="You don't have any datasets yet."
                buttonText="New dataset"
                description="Datasets help you organize your data. Datasets will appear here when you create them."
                onClick={onClickEmptyState}
              />
            )
          }
        />

        <DatasetSelectedOptionPopup
          selectedRowKeys={selectedRowKeys}
          onSelectChange={setSelectedRowKeys}
        />
      </AppContent>
    </>
  );
});

DatasetListContent.displayName = 'DatasetListContent';

const getStatusText = (d: BusterDatasetListItem) => {
  if (d.enabled) {
    return 'Published';
  }
  return 'Draft';
};
