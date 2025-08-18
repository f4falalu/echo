import React from 'react';
import { SaveResetFilePopup } from '@/components/features/popups/SaveResetFilePopup';
import { useUpdateMetricChart } from '@/context/Metrics/useUpdateMetricChart';
import {
  useChatIsFileChanged,
  useChatOnResetToOriginal,
} from '@/layouts/ChatLayout/ChatContext/useChatContextSelectors';

export const MetricSaveFilePopup: React.FC<{ metricId: string }> = React.memo(({ metricId }) => {
  const onResetToOriginal = useChatOnResetToOriginal();
  const isFileChanged = useChatIsFileChanged();
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
