import { Separator } from '@/components/ui/separator';
import {
  useGetDatasetPageDataset,
  useGetDatasetPageDatasetData,
} from '../DatasetsIndividualLayout/DatasetPageContext';
import { OverviewData } from './OverviewData';
import { OverviewHeader } from './OverviewHeader';

export function DatasetOverviewController() {
  const datasetRes = useGetDatasetPageDataset();
  const datasetDataRes = useGetDatasetPageDatasetData();

  const datasetData = datasetDataRes?.data;
  const dataset = datasetRes?.data;
  const isFetchedDataset = datasetRes?.isFetched;
  const isFetchedDatasetData = datasetDataRes?.isFetched;

  const showSkeletonLoader = !dataset?.id || !isFetchedDataset;

  return (
    <div className="mx-auto overflow-y-auto px-14 pt-12 pb-12">
      {showSkeletonLoader ? null : (
        <div className="flex w-full flex-col space-y-5">
          <OverviewHeader
            datasetId={dataset.id}
            description={dataset.description}
            name={dataset.name}
          />

          <Separator />

          <OverviewData
            datasetId={dataset.id}
            data={datasetData || []}
            isFetchedDatasetData={isFetchedDatasetData}
          />
        </div>
      )}
    </div>
  );
}
