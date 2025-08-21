'use client';

import React, { useMemo } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useIndividualDataset } from '@/api/buster_rest/datasets';
import {
  Breadcrumb,
  type BreadcrumbItemType,
  createBreadcrumbItems,
} from '@/components/ui/breadcrumb';

export const DatasetHeader: React.FC<{
  datasetFilter: 'all' | 'published' | 'drafts';
  setDatasetFilter: (filter: 'all' | 'published' | 'drafts') => void;
  datasetId?: string;
  setOpenNewDatasetModal: (open: boolean) => void;
  openNewDatasetModal: boolean;
}> = React.memo(({ datasetId, setOpenNewDatasetModal }) => {
  const { dataset } = useIndividualDataset({ datasetId });
  const datasetTitle = dataset?.data?.name || 'Datasets';

  const breadcrumbItems: BreadcrumbItemType[] = useMemo(
    () =>
      createBreadcrumbItems([
        {
          label: datasetTitle,
          link: datasetId
            ? {
                to: '/app/datasets/$datasetId/overview',
                params: { datasetId },
              }
            : { to: '/app/datasets' },
        },
      ]),
    [datasetId, datasetTitle]
  );

  const onOpenNewDatasetModal = () => {
    setOpenNewDatasetModal(true);
  };

  useHotkeys('d', onOpenNewDatasetModal);

  return (
    <>
      <div className="flex space-x-3">
        <Breadcrumb items={breadcrumbItems} />
        {/* <DatasetFilters datasetFilter={datasetFilter} setDatasetFilter={setDatasetFilter} /> */}
      </div>

      {/* <div className="flex items-center">
          {isAdmin && (
            <AppTooltip title={'Create new dashboard'} shortcuts={['D']}>
              <Button prefix={<Plus />} onClick={onOpenNewDatasetModal}>
                New Dataset
              </Button>
            </AppTooltip>
          )}
        </div>

        {isAdmin && <NewDatasetModal open={openNewDatasetModal} onClose={onCloseNewDatasetModal} />} */}
    </>
  );
});
DatasetHeader.displayName = 'DatasetHeader';

// const DatasetFilters: React.FC<{
//   datasetFilter: 'all' | 'published' | 'drafts';
//   setDatasetFilter: (filter: 'all' | 'published' | 'drafts') => void;
// }> = ({ datasetFilter, setDatasetFilter }) => {
//   const options: SegmentedItem<'all' | 'published' | 'drafts'>[] = useMemo(
//     () => [
//       { label: 'All', value: 'all' },
//       { label: 'Published', value: 'published' },
//       { label: 'Drafts', value: 'drafts' },
//     ],
//     []
//   );

//   return (
//     <AppSegmented
//       options={options}
//       value={datasetFilter}
//       type="button"
//       onChange={(value) => {
//         setDatasetFilter(value.value);
//       }}
//     />
//   );
// };
