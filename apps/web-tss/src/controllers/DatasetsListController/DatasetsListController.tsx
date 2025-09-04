import React, { lazy, useMemo, useState } from 'react';
import { useGetDatasets } from '@/api/buster_rest/datasets';
import { useIsUserAdmin } from '@/api/buster_rest/users/useGetUserInfo';
import { AppPageLayout } from '@/components/ui/layouts/AppPageLayout';
import { DatasetListContent } from './DatasetListContent';
import { DatasetHeader } from './DatasetsHeader';

const NewDatasetModal = lazy(() =>
  import('@/components/features/modals/NewDatasetModal').then((mod) => ({
    default: mod.NewDatasetModal,
  }))
);

export const DatasetsListController: React.FC<Record<string, never>> = () => {
  const isAdmin = useIsUserAdmin();
  const [datasetFilter, setDatasetFilter] = useState<'all' | 'published' | 'drafts'>('all');
  const [openDatasetModal, setOpenDatasetModal] = useState<boolean>(false);

  const datasetsParams: Parameters<typeof useGetDatasets>[0] = useMemo(() => {
    if (datasetFilter === 'drafts') {
      return {
        enabled: false,
        admin_view: isAdmin,
      };
    }

    if (datasetFilter === 'published') {
      return {
        enabled: true,
        admin_view: isAdmin,
      };
    }

    return {
      admin_view: isAdmin,
    };
  }, [datasetFilter]);

  const { isFetched: isFetchedDatasets, data: datasetsList } = useGetDatasets(datasetsParams);

  return (
    <AppPageLayout
      headerSizeVariant="list"
      header={
        <DatasetHeader
          datasetFilter={datasetFilter}
          setDatasetFilter={setDatasetFilter}
          openNewDatasetModal={openDatasetModal}
          setOpenNewDatasetModal={setOpenDatasetModal}
        />
      }
    >
      <DatasetListContent
        datasetsList={datasetsList || []}
        isFetchedDatasets={isFetchedDatasets}
        isAdmin={isAdmin}
        setOpenNewDatasetModal={setOpenDatasetModal}
      />

      <NewDatasetModal open={openDatasetModal} onClose={() => setOpenDatasetModal(false)} />
    </AppPageLayout>
  );
};
