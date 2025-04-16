'use client';

import { useGetDashboard, useUpdateDashboard } from '@/api/buster_rest/dashboards';
import { useGetMetric, useSaveMetric } from '@/api/buster_rest/metrics';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn } from '@/hooks';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout';
import { useCloseVersionHistory } from '@/layouts/ChatLayout/FileContainer/FileContainerHeader/FileContainerHeaderVersionHistory';
import { BusterRoutes, createBusterRoute } from '@/routes';
import last from 'lodash/last';
import { useMemo } from 'react';

export const useListVersionHistories = ({
  assetId,
  type
}: {
  assetId: string;
  type: 'metric' | 'dashboard';
}) => {
  const { onCloseVersionHistory } = useCloseVersionHistory();
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const {
    dashboardVersions,
    selectedQueryVersion: dashboardSelectedQueryVersion,
    currentVersionNumber: dashboardCurrentVersionNumber,
    onRestoreVersion: onRestoreDashboardVersion,
    isSavingDashboard
  } = useListDashboardVersions({
    assetId,
    type
  });
  const {
    metricVersions,
    selectedQueryVersion: metricSelectedQueryVersion,
    currentVersionNumber: metricCurrentVersionNumber,
    onRestoreVersion: onRestoreMetricVersion,
    isSavingMetric
  } = useListMetricVersions({
    assetId,
    type
  });

  const listItems = useMemo(() => {
    const items = type === 'metric' ? metricVersions : dashboardVersions;
    return items ? [...items].reverse() : [];
  }, [type, dashboardVersions, metricVersions]);

  const currentVersionNumber = useMemo(() => {
    return type === 'metric' ? metricCurrentVersionNumber : dashboardCurrentVersionNumber;
  }, [type, dashboardCurrentVersionNumber, metricCurrentVersionNumber]);

  const selectedQueryVersion = useMemo(() => {
    return type === 'metric' ? metricSelectedQueryVersion : dashboardSelectedQueryVersion;
  }, [type, dashboardSelectedQueryVersion, metricSelectedQueryVersion]);

  const onClickRestoreVersion = useMemoizedFn(
    async (versionNumber: number, rereouteToAsset: boolean = true) => {
      if (type === 'metric') {
        await onRestoreMetricVersion(versionNumber);
        if (rereouteToAsset) {
          await onChangePage(
            createBusterRoute({
              route: BusterRoutes.APP_METRIC_ID_CHART,
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

      onCloseVersionHistory();
    }
  );

  return useMemo(() => {
    return {
      listItems,
      currentVersionNumber,
      selectedQueryVersion,
      onClickRestoreVersion,
      isRestoringVersion: isSavingDashboard || isSavingMetric
    };
  }, [
    listItems,
    currentVersionNumber,
    selectedQueryVersion,
    onClickRestoreVersion,
    isSavingDashboard,
    isSavingMetric
  ]);
};

const useListDashboardVersions = ({
  assetId,
  type
}: {
  assetId: string;
  type: 'metric' | 'dashboard';
}) => {
  const dashboardVersionNumber = useChatLayoutContextSelector((x) => x.dashboardVersionNumber);
  const { mutateAsync: updateDashboard, isPending: isSavingDashboard } = useUpdateDashboard({
    saveToServer: true,
    updateVersion: true
  });
  const { data: dashboardData } = useGetDashboard(
    {
      id: type === 'dashboard' ? assetId : undefined,
      versionNumber: null
    },
    {
      select: (x) => ({
        versions: x.versions,
        version_number: x.dashboard.version_number
      })
    }
  );

  const dashboardVersions = dashboardData?.versions;
  const currentVersionNumber = dashboardData?.version_number;

  const selectedQueryVersion = useMemo(() => {
    if (dashboardVersionNumber) return dashboardVersionNumber;
    return last(dashboardVersions)?.version_number;
  }, [dashboardVersions, dashboardVersionNumber]);

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
      currentVersionNumber,
      isSavingDashboard
    };
  }, [
    dashboardVersions,
    currentVersionNumber,
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

  const metricVersionNumber = useChatLayoutContextSelector((x) => x.metricVersionNumber);

  const { data: metric } = useGetMetric(
    {
      id: type === 'metric' ? assetId : undefined
    },
    {
      select: (x) => ({
        versions: x.versions,
        version_number: x.version_number
      })
    }
  );
  const metricVersions = metric?.versions;
  const currentVersionNumber = metricVersionNumber || metric?.version_number;

  const onRestoreVersion = useMemoizedFn(async (versionNumber: number) => {
    await updateMetric({
      id: assetId,
      restore_to_version: versionNumber
    });
  });

  const selectedQueryVersion = useMemo(() => {
    if (metricVersionNumber) return metricVersionNumber;
    return last(metricVersions)?.version_number;
  }, [metricVersions, metricVersionNumber]);

  return useMemo(() => {
    return {
      metricVersions,
      selectedQueryVersion,
      onRestoreVersion,
      currentVersionNumber,
      isSavingMetric
    };
  }, [
    metricVersions,
    onRestoreVersion,
    selectedQueryVersion,
    currentVersionNumber,
    isSavingMetric
  ]);
};
