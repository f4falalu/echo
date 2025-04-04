'use client';

import React, { useEffect } from 'react';
import { useMemoizedFn } from '@/hooks';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useGetMetric, useUpdateMetric } from '@/api/buster_rest/metrics';
import { EditFileContainer } from '@/components/features/files/EditFileContainer';

export const MetricViewFile: React.FC<{ metricId: string }> = React.memo(({ metricId }) => {
  const { data: metric } = useGetMetric({ id: metricId }, ({ file, file_name }) => ({
    file,
    file_name
  }));
  const { openSuccessMessage } = useBusterNotifications();
  const {
    mutateAsync: updateMetric,
    isPending: isUpdatingMetric,
    error: updateMetricError
  } = useUpdateMetric({
    updateOnSave: true,
    saveToServer: true,
    updateVersion: true,
    wait: 0
  });

  const updateMetricErrorMessage = updateMetricError?.message;

  const { file, file_name } = metric || {};

  const onSaveFile = useMemoizedFn(async () => {
    await updateMetric({
      file,
      id: metricId
    });
    openSuccessMessage(`${file_name} saved`);
  });

  return (
    <EditFileContainer
      fileName={file_name}
      file={file}
      onSaveFile={onSaveFile}
      error={updateMetricErrorMessage}
      isSaving={isUpdatingMetric}
    />
  );
});

MetricViewFile.displayName = 'MetricViewFile';
