'use client';

import { useGetDashboard, useUpdateDashboard } from '@/api/buster_rest/dashboards';
import { useGetMetric, useSaveMetric } from '@/api/buster_rest/metrics';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn } from '@/hooks';
import { useCloseVersionHistory } from '@/layouts/ChatLayout/FileContainer/FileContainerHeader/FileContainerHeaderVersionHistory';
import { BusterRoutes, createBusterRoute } from '@/routes';
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
  const removeVersionHistoryQueryParams = useCloseVersionHistory();
  const onChangeQueryParams = useAppLayoutContextSelector((x) => x.onChangeQueryParams);
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const {
    dashboardVersions,
    selectedQueryVersion: dashboardSelectedQueryVersion,
    selectedVersion: dashboardSelectedVersion,
    onRestoreVersion: onRestoreDashboardVersion,
    isSavingDashboard
  } = useListDashboardVersions({
    assetId,
    type
  });
  const {
    metricVersions,
    selectedQueryVersion: metricSelectedQueryVersion,
    selectedVersion: metricSelectedVersion,
    onRestoreVersion: onRestoreMetricVersion,
    isSavingMetric
  } = useListMetricVersions({
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

  const selectedQueryVersion = useMemo(() => {
    return type === 'metric' ? metricSelectedQueryVersion : dashboardSelectedQueryVersion;
  }, [type, dashboardSelectedQueryVersion, metricSelectedQueryVersion]);

  const onClickVersionHistory = useMemoizedFn((versionNumber: number) => {
    if (type === 'metric') onChangeQueryParams({ metric_version_number: versionNumber.toString() });
    if (type === 'dashboard')
      onChangeQueryParams({ dashboard_version_number: versionNumber.toString() });
  });

  const onClickRestoreVersion = useMemoizedFn(
    async (versionNumber: number, rereouteToAsset: boolean = true) => {
      if (type === 'metric') {
        await onRestoreMetricVersion(versionNumber);
        if (rereouteToAsset) {
          await onChangePage(
            createBusterRoute({
              route: BusterRoutes.APP_METRIC_ID,
              metricId: assetId
            })
          );
        }
      }
      if (type === 'dashboard') {
        await onRestoreDashboardVersion(versionNumber);
        if (rereouteToAsset) {
          await onChangePage(
            createBusterRoute({
              route: BusterRoutes.APP_DASHBOARD_ID,
              dashboardId: assetId
            })
          );
        }
      }

      removeVersionHistoryQueryParams();
    }
  );

  return useMemo(() => {
    return {
      listItems,
      selectedVersion,
      selectedQueryVersion,
      onClickVersionHistory,
      onClickRestoreVersion
    };
  }, [
    listItems,
    selectedVersion,
    selectedQueryVersion,
    onClickVersionHistory,
    onClickRestoreVersion
  ]);
};

const useListDashboardVersions = ({
  assetId,
  type
}: {
  assetId: string;
  type: 'metric' | 'dashboard';
}) => {
  const selectedVersionParam = useSearchParams().get('dashboard_version_number');
  const { mutateAsync: updateDashboard, isPending: isSavingDashboard } = useUpdateDashboard();
  const { data: dashData } = useGetDashboard(
    {
      id: type === 'dashboard' ? assetId : undefined,
      version_number: null
    },
    (x) => ({
      versions: x.dashboard.versions,
      version_number: x.dashboard.version_number
    })
  );

  const dashboardVersions = dashData?.versions;
  const selectedVersion = dashData?.version_number;

  const selectedQueryVersion = useMemo(() => {
    if (selectedVersionParam) return parseInt(selectedVersionParam);
    return last(dashboardVersions)?.version_number;
  }, [dashboardVersions, selectedVersionParam]);

  const onRestoreVersion = useMemoizedFn(async (versionNumber: number) => {
    await updateDashboard({
      id: assetId,
      restore_to_version: versionNumber
    });
  });

  return useMemo(() => {
    return {
      dashboardVersions,
      selectedQueryVersion,
      onRestoreVersion,
      selectedVersion,
      isSavingDashboard
    };
  }, [
    dashboardVersions,
    selectedVersion,
    onRestoreVersion,
    selectedQueryVersion,
    isSavingDashboard
  ]);
};

const useListMetricVersions = ({
  assetId,
  type
}: {
  assetId: string;
  type: 'metric' | 'dashboard';
}) => {
  const { mutateAsync: updateMetric, isPending: isSavingMetric } = useSaveMetric({
    updateOnSave: true
  });
  const selectedVersionParam = useSearchParams().get('metric_version_number');
  const { data: metricData } = useGetMetric(
    {
      id: type === 'metric' ? assetId : undefined,
      version_number: null
    },
    (x) => ({
      versions: x.versions,
      version_number: x.version_number
    })
  );
  const metricVersions = metricData?.versions;
  const selectedVersion = metricData?.version_number;

  const onRestoreVersion = useMemoizedFn(async (versionNumber: number) => {
    await updateMetric({
      id: assetId,
      restore_to_version: versionNumber
    });
  });

  const selectedQueryVersion = useMemo(() => {
    if (selectedVersionParam) return parseInt(selectedVersionParam);
    return last(metricVersions)?.version_number;
  }, [metricVersions, selectedVersionParam]);

  return useMemo(() => {
    return {
      metricVersions,
      selectedQueryVersion,
      onRestoreVersion,
      selectedVersion,
      isSavingMetric
    };
  }, [metricVersions, onRestoreVersion, selectedQueryVersion, selectedVersion, isSavingMetric]);
};
