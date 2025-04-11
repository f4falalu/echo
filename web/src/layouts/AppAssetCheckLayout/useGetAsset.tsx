'use client';

import { useGetMetric, useGetMetricData } from '@/api/buster_rest/metrics';
import { useGetDashboard } from '@/api/buster_rest/dashboards';
import { RustApiError } from '@/api/buster_rest/errors';

interface BaseGetAssetProps {
  assetId: string;
}

interface MetricAssetProps extends BaseGetAssetProps {
  type: 'metric';
  versionNumber?: number;
}

interface DashboardAssetProps extends BaseGetAssetProps {
  type: 'dashboard';
}

type UseGetAssetProps = MetricAssetProps | DashboardAssetProps;

type UseGetAssetReturn<T extends UseGetAssetProps> = {
  isFetched: boolean;
  error: RustApiError | null;
  hasAccess: boolean;
  passwordRequired: boolean;
  isPublic: boolean;
  showLoader: boolean;
};

export const useGetAsset = (props: UseGetAssetProps): UseGetAssetReturn<typeof props> => {
  //metric
  const {
    error: errorMetric,
    isError: isErrorMetric,
    dataUpdatedAt,
    isFetched: isFetchedMetric
  } = useGetMetric(
    {
      id: props.assetId,
      versionNumber: props.type === 'metric' ? props.versionNumber : undefined
    },
    {
      enabled: props.type === 'metric' && !!props.assetId
    }
  );
  const { isFetched: isFetchedMetricData } = useGetMetricData(
    {
      id: props.assetId,
      versionNumber: props.type === 'metric' ? props.versionNumber : undefined
    },
    {
      enabled:
        props.type === 'metric' &&
        !!props.assetId &&
        isFetchedMetric &&
        !!dataUpdatedAt && //This is a hack to prevent the query from being run when the asset is not fetched.
        !isErrorMetric
    }
  );

  //dashboard
  const {
    isFetched: isFetchedDashboard,
    error: errorDashboard,
    isError: isErrorDashboard
  } = useGetDashboard(
    {
      id: props.type === 'dashboard' ? props.assetId : undefined
    },
    { enabled: props.type === 'dashboard' && !!props.assetId }
  );

  const { hasAccess, passwordRequired, isPublic } = getAssetAccess({
    error: props.type === 'metric' ? errorMetric : errorDashboard
  });

  if (props.type === 'metric') {
    return {
      isFetched: isFetchedMetric,
      error: errorMetric,
      hasAccess,
      passwordRequired,
      isPublic,
      showLoader: (!isFetchedMetricData || !!errorMetric) && !isFetchedMetric
    };
  }

  const exhaustiveCheck: 'dashboard' = props.type;

  return {
    isFetched: isFetchedDashboard,
    error: errorDashboard,
    hasAccess,
    passwordRequired,
    isPublic,
    showLoader: !isFetchedDashboard || isErrorDashboard
  };
};

const getAssetAccess = ({
  error
}: {
  error: RustApiError | null;
}): {
  hasAccess: boolean;
  passwordRequired: boolean;
  isPublic: boolean;
} => {
  if (!error) {
    return {
      hasAccess: true,
      passwordRequired: false,
      isPublic: false
    };
  }

  const status = error?.status;

  if (status === 418) {
    return {
      hasAccess: false,
      passwordRequired: true,
      isPublic: true
    };
  }

  return {
    hasAccess: false,
    passwordRequired: false,
    isPublic: false
  };
};
