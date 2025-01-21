import { useGetDatasets } from '@/api/buster-rest';
import { Select } from 'antd';
import React from 'react';

export const SelectedDatasetInput: React.FC<{
  onSetDatasetId: (datasetId: string) => void;
}> = React.memo(({ onSetDatasetId }) => {
  const { data: datasets, isFetched } = useGetDatasets();

  return (
    <Select
      placeholder="Select a dataset"
      loading={!isFetched}
      className="w-full"
      onChange={onSetDatasetId}
      options={datasets?.map((dataset) => ({
        label: dataset.name,
        value: dataset.id
      }))}
    />
  );
});

SelectedDatasetInput.displayName = 'SelectedDatasetInput';
