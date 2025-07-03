import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';

export const createDatasetRoute = ({
  datasetId,
  chatId
}: {
  datasetId: string;
  chatId: string | undefined;
}) => {
  return createBusterRoute({
    route: BusterRoutes.APP_DATASETS_ID,
    datasetId
  });
};
