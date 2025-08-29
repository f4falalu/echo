import type { AssetType } from '@buster/server-shared/assets';
import type { ResponseMessageFileType } from '@buster/server-shared/chats';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { RustApiError } from '@/api/errors';
import { chatQueryKeys } from '@/api/query_keys/chat';
import { collectionQueryKeys } from '@/api/query_keys/collection';
import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import { reportsQueryKeys } from '@/api/query_keys/reports';

interface AssetAccess {
  hasAccess: boolean;
  passwordRequired: boolean;
  isPublic: boolean;
  isDeleted: boolean;
}

const getAssetAccess = (error: RustApiError | null): AssetAccess => {
  if (!error) {
    return { hasAccess: true, passwordRequired: false, isPublic: false, isDeleted: false };
  }

  if (error.status === 418) {
    return { hasAccess: false, passwordRequired: true, isPublic: true, isDeleted: false };
  }

  if (error.status === 410) {
    return { hasAccess: false, passwordRequired: false, isPublic: false, isDeleted: true };
  }

  return { hasAccess: false, passwordRequired: false, isPublic: false, isDeleted: false };
};

export const useGetAssetPasswordConfig = (
  assetId: string,
  type: AssetType | ResponseMessageFileType,
  versionNumber: number | undefined
) => {
  const chosenVersionNumber = versionNumber || 'LATEST';

  const selectedQuery = useMemo(() => {
    if (type === 'metric') {
      return metricsQueryKeys.metricsGetMetric(assetId, chosenVersionNumber);
    }
    if (type === 'dashboard') {
      return dashboardQueryKeys.dashboardGetDashboard(assetId, chosenVersionNumber);
    }
    if (type === 'report') {
      return reportsQueryKeys.reportsGetReport(assetId, chosenVersionNumber);
    }
    if (type === 'collection') {
      return collectionQueryKeys.collectionsGetCollection(assetId);
    }
    if (type === 'reasoning') {
      return chatQueryKeys.chatsGetChat(assetId);
    }

    const _exhaustiveCheck: 'chat' = type;

    return chatQueryKeys.chatsGetChat(assetId);
  }, [type, assetId, chosenVersionNumber]);

  const { error } = useQuery({
    queryKey: selectedQuery.queryKey,
    enabled: false,
    notifyOnChangeProps: ['error'],
  });

  return getAssetAccess(error);
};
