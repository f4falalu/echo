import { SaveResetFilePopup } from '@/components/features/popups/SaveResetFilePopup';
import { useIsMetricChanged } from '@/context/Metrics/useIsMetricChanged';
import { useUpdateMetricChart } from '@/context/Metrics/useUpdateMetricChart';
import React from 'react';

export const MetricSaveFilePopup: React.FC<{ metricId: string }> = React.memo(({ metricId }) => {
  const { isMetricChanged, onResetMetricToOriginal } = useIsMetricChanged({ metricId });
  const { onSaveMetricToServer, isSaving } = useUpdateMetricChart({ metricId });

  return (
    <SaveResetFilePopup
      open={isMetricChanged}
      onReset={onResetMetricToOriginal}
      onSave={onSaveMetricToServer}
      isSaving={isSaving}
      showHotsKeys={false}
    />
  );
});

MetricSaveFilePopup.displayName = 'MetricSaveFilePopup';
