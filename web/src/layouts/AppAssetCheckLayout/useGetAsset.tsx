'use client';

import { useGetMetric, useGetMetricData } from '@/api/buster_rest/metrics';
import { useGetDashboard } from '@/api/buster_rest/dashboards';
import { RustApiError } from '@/api/buster_rest/errors';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

interface BaseGetAssetProps {
  assetId: string;
}

interface MetricAssetProps extends BaseGetAssetProps {
  type: 'metric';
  versionNumber?: number;
}

interface DashboardAssetProps extends BaseGetAssetProps {
  type: 'dashboard';
  versionNumber?: number;
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
  const searchParams = useSearchParams();
  const metricVersionNumber = searchParams.get('metric_version_number');
  const dashboardVersionNumber = searchParams.get('dashboard_version_number');

  const queryParamVersionNumber: number | undefined = useMemo(() => {
    if (props.type === 'metric' && metricVersionNumber) {
      return parseInt(metricVersionNumber);
    }
    if (props.type === 'dashboard' && dashboardVersionNumber) {
      return parseInt(dashboardVersionNumber);
    }
    return undefined;
  }, [props.type, metricVersionNumber, dashboardVersionNumber]);

  const versionNumber: number | undefined = useMemo(() => {
    if (props.type === 'metric') {
      if (props.versionNumber) return props.versionNumber;
      if (queryParamVersionNumber) return queryParamVersionNumber;
    }
    if (props.type === 'dashboard') {
      if (props.versionNumber) return props.versionNumber;
      if (queryParamVersionNumber) return queryParamVersionNumber;
    }
    return undefined;
  }, [props, queryParamVersionNumber]);

  //metric
  const { error: errorMetric, isFetched: isFetchedMetric } = useGetMetric(
    {
      id: props.type === 'metric' ? props.assetId : undefined,
      versionNumber
    },
    { enabled: props.type === 'metric' && !!props.assetId }
  );

  const { isFetched: isFetchedMetricData } = useGetMetricData({
    id: props.assetId,
    versionNumber
  });

  //dashboard
  const {
    isFetched: isFetchedDashboard,
    error: errorDashboard,
    isError: isErrorDashboard
  } = useGetDashboard({
    id: props.type === 'dashboard' ? props.assetId : undefined,
    versionNumber
  });

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
      showLoader: !isFetchedMetricData && !errorMetric && !isFetchedMetric
    };
  }

  const exhaustiveCheck: 'dashboard' = props.type;

  return {
    isFetched: isFetchedDashboard,
    error: errorDashboard,
    hasAccess,
    passwordRequired,
    isPublic,
    showLoader: !isFetchedDashboard && !isErrorDashboard
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
