import { useMemo } from 'react';
import { useIsDashboardChanged } from '../Dashboards/useIsDashboardChanged';
import { useIsMetricFileChanged } from '../Metrics/useIsMetricFileChanged';
import { useIsReportFileChanged } from '../Reports/useIsReportFileChanged';
import { useSelectedAssetId, useSelectedAssetType } from './useSelectedAssetType';

export const useIsAssetFileChanged = () => {
  const assetType = useSelectedAssetType();
  const assetId = useSelectedAssetId() || '';

  const metricParams = useIsMetricFileChanged({
    metricId: assetId,
    enabled: assetType === 'metric',
  });
  const dashboardParams = useIsDashboardChanged({
    dashboardId: assetId,
    enabled: assetType === 'dashboard',
  });
  const reportParams = useIsReportFileChanged({
    reportId: assetId,
    enabled: assetType === 'report',
  });

  return useMemo(() => {
    if (assetType === 'metric') {
      return metricParams;
    }

    if (assetType === 'dashboard') {
      return dashboardParams;
    }

    if (assetType === 'report') {
      return reportParams;
    }

    const _exhaustiveCheck: 'chat' | 'collection' | 'reasoning' = assetType;

    return {
      isFileChanged: false,
      onResetToOriginal: () => {
        console.warn('No reset to original for asset type', assetType);
      },
    };
  }, [assetType, metricParams, dashboardParams, reportParams]);
};
