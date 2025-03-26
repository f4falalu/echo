import { useGetDashboard } from '@/api/buster_rest/dashboards';
import { useGetMetric } from '@/api/buster_rest/metrics';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn } from '@/hooks';
import last from 'lodash/last';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

export const useListVersionHistories = ({
  assetId,
  type
}: {
  assetId: string;
  type: 'metric' | 'dashboard';
}) => {
  const onChangeQueryParams = useAppLayoutContextSelector((x) => x.onChangeQueryParams);
  const { dashboardVersions, selectedVersion: dashboardSelectedVersion } = useListDashboardVersions(
    {
      assetId,
      type
    }
  );
  const { metricVersions, selectedVersion: metricSelectedVersion } = useListMetricVersions({
    assetId,
    type
  });

  const listItems = useMemo(() => {
    const items = type === 'metric' ? metricVersions : dashboardVersions;
    return items ? [...items].reverse() : undefined;
  }, [type, dashboardVersions, metricVersions]);

  const selectedVersion = useMemo(() => {
    return type === 'metric' ? metricSelectedVersion : dashboardSelectedVersion;
  }, [type, dashboardSelectedVersion, metricSelectedVersion]);

  const onClickVersionHistory = useMemoizedFn((versionNumber: number) => {
    if (type === 'metric') onChangeQueryParams({ metric_version_number: versionNumber.toString() });
    if (type === 'dashboard')
      onChangeQueryParams({ dashboard_version_number: versionNumber.toString() });
  });

  return useMemo(() => {
    return {
      listItems,
      selectedVersion,
      onClickVersionHistory
    };
  }, [listItems, selectedVersion, onClickVersionHistory]);
};

const useListDashboardVersions = ({
  assetId,
  type
}: {
  assetId: string;
  type: 'metric' | 'dashboard';
}) => {
  const selectedVersionParam = useSearchParams().get('dashboard_version_number');
  const { data: dashboardVersions } = useGetDashboard(
    {
      id: type === 'dashboard' ? assetId : undefined,
      version_number: null
    },
    (x) => x.dashboard.versions
  );

  const selectedVersion = useMemo(() => {
    if (selectedVersionParam) return parseInt(selectedVersionParam);
    return last(dashboardVersions)?.version_number;
  }, [dashboardVersions, selectedVersionParam]);

  return useMemo(() => {
    return {
      dashboardVersions,
      selectedVersion
    };
  }, [dashboardVersions, selectedVersion]);
};

const useListMetricVersions = ({
  assetId,
  type
}: {
  assetId: string;
  type: 'metric' | 'dashboard';
}) => {
  const selectedVersionParam = useSearchParams().get('metric_version_number');
  const { data: metricVersions } = useGetMetric(
    {
      id: type === 'metric' ? assetId : undefined,
      version_number: null
    },
    (x) => x.versions
  );

  const selectedVersion = useMemo(() => {
    if (selectedVersionParam) return parseInt(selectedVersionParam);
    return last(metricVersions)?.version_number;
  }, [metricVersions, selectedVersionParam]);

  return useMemo(() => {
    return {
      metricVersions,
      selectedVersion
    };
  }, [metricVersions, selectedVersion]);
};
