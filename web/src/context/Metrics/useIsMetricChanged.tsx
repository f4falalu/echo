'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useOriginalMetricStore } from './useOriginalMetricStore';
import { useMemoizedFn } from '@/hooks';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import { useGetMetric, useGetMetricVersionNumber } from '@/api/buster_rest/metrics';
import { compareObjectsByKeys } from '@/lib/objects';
import { useMemo } from 'react';
import last from 'lodash/last';

export const useIsMetricChanged = ({ metricId }: { metricId: string | undefined }) => {
  const queryClient = useQueryClient();
  const originalMetric = useOriginalMetricStore((x) => x.getOriginalMetric(metricId));

  const { data: currentMetric, refetch: refetchCurrentMetric } = useGetMetric(
    { id: metricId, versionNumber: undefined },
    {
      select: (x) => ({
        name: x.name,
        description: x.description,
        chart_config: x.chart_config,
        file: x.file,
        version_number: x.version_number,
        versions: x.versions
      })
    }
  );
  const isLatestVersion = useMemo(() => {
    return currentMetric?.version_number === last(currentMetric?.versions)?.version_number;
  }, [currentMetric]);

  const onResetMetricToOriginal = useMemoizedFn(() => {
    const options = metricsQueryKeys.metricsGetMetric(
      metricId || '',
      originalMetric?.version_number || null
    );
    if (originalMetric) {
      queryClient.setQueryData(options.queryKey, originalMetric);
    }
    refetchCurrentMetric();
  });

  const isMetricChanged = useMemo(() => {
    if (!originalMetric || !isLatestVersion) return false;

    return (
      !currentMetric ||
      !compareObjectsByKeys(originalMetric, currentMetric, [
        'name',
        'description',
        'chart_config',
        'file',
        'version_number'
      ])
    );
  }, [originalMetric, currentMetric, isLatestVersion]);

  return {
    onResetMetricToOriginal,
    isMetricChanged
  };
};
