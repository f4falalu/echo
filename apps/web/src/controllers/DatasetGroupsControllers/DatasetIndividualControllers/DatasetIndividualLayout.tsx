import { DatasetGroupAppSegments } from './DatasetGroupAppSegments';
import { DatasetGroupBackButton } from './DatasetGroupBackButton';
import { DatasetGroupTitleAndDescription } from './DatasetGroupTitleAndDescription';

export const DatasetGroupsIndividualLayout = ({
  children,
  datasetGroupId,
}: {
  children: React.ReactNode;
  datasetGroupId: string;
}) => {
  return (
    <div className="flex h-full flex-col space-y-5 overflow-y-auto px-12 py-12">
      <DatasetGroupBackButton />
      <DatasetGroupTitleAndDescription datasetGroupId={datasetGroupId} />
      <DatasetGroupAppSegments datasetGroupId={datasetGroupId} />
      {children}
    </div>
  );
};
