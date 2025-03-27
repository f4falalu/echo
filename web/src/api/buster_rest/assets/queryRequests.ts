import { QueryClient, useQuery } from '@tanstack/react-query';
import { getAssetCheck, getAssetCheck_server } from './requests';
import { queryKeys } from '@/api/query_keys';
import { FileType } from '@/api/asset_interfaces';
import type { PublicAssetResponse } from './interface';

export const prefetchAssetCheck = async (
  { assetId, fileType }: { assetId: string; fileType: FileType },
  queryClientProp?: QueryClient
): Promise<{ queryClient: QueryClient; res: PublicAssetResponse }> => {
  const queryClient = queryClientProp || new QueryClient();

  const res = await getAssetCheck_server({ type: fileType, id: assetId });

  await queryClient.prefetchQuery({
    ...queryKeys.assetCheck(assetId, fileType),
    //  queryFn: () => getAssetCheck({ type: fileType, id: assetId }),
    initialData: res
  });

  return { queryClient, res };
};

export const useAssetCheck = <TData = PublicAssetResponse>(
  {
    assetId,
    fileType
  }: {
    assetId: string | undefined;
    fileType: FileType | undefined;
  },
  select?: (d: PublicAssetResponse) => TData
) => {
  return useQuery({
    ...queryKeys.assetCheck(assetId || '', fileType || 'metric'),
    queryFn: () => getAssetCheck({ type: fileType!, id: assetId! }),
    enabled: false, //this will happen on the server
    select
  });
};
