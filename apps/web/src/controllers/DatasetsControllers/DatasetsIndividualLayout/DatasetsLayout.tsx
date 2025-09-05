import { AppPageLayout } from '@/components/ui/layouts/AppPageLayout';
import { DatasetPageProvider } from './DatasetPageContext';
import { DatasetsIndividualHeader } from './DatasetsIndividualHeader';

export const DatasetsIndividualLayout = ({
  datasetId,
  children,
}: {
  datasetId: string;
  children: React.ReactNode;
}) => {
  return (
    <DatasetPageProvider datasetId={datasetId}>
      <AppPageLayout header={<DatasetsIndividualHeader />}>{children}</AppPageLayout>
    </DatasetPageProvider>
  );
};
