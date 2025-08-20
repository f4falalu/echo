import React from 'react';
import { SaveResetFilePopup } from '@/components/features/popups/SaveResetFilePopupBase';
import { useIsMetricFileChanged } from '@/context/Metrics/useIsMetricFileChanged';
import { useUpdateMetricChart } from '@/context/Metrics/useUpdateMetricChart';

export const MetricSaveFilePopup: React.FC<{ metricId: string }> = React.memo(({ metricId }) => {
  const { isFileChanged, onResetToOriginal } = useIsMetricFileChanged({ metricId });
  const { onSaveMetricToServer, isSaving } = useUpdateMetricChart({ metricId });

  return (
    <SaveResetFilePopup
      open={isFileChanged}
      onReset={onResetToOriginal}
      onSave={onSaveMetricToServer}
      isSaving={isSaving}
      showHotsKeys={false}
    />
  );
});

MetricSaveFilePopup.displayName = 'MetricSaveFilePopup';
