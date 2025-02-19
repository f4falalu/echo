import React, { useEffect } from 'react';
import type { MetricViewProps } from '../config';
import { CodeCard } from '@/components/card';
import { useMetricIndividual, useBusterMetricsIndividualContextSelector } from '@/context/Metrics';
import { useMemoizedFn } from 'ahooks';
import { SaveResetFilePopup } from '@appComponents/Popups/SaveResetFilePopup';
import { useBusterNotifications } from '@/context/BusterNotifications';

export const MetricViewFile: React.FC<MetricViewProps> = React.memo(({ metricId }) => {
  const { metric } = useMetricIndividual({ metricId });
  const { openSuccessMessage } = useBusterNotifications();
  const onUpdateMetric = useBusterMetricsIndividualContextSelector((x) => x.onUpdateMetric);

  const { file: fileProp, file_name } = metric;

  const [file, setFile] = React.useState(fileProp);

  const showPopup = file !== fileProp && !!file;

  const onResetFile = useMemoizedFn(() => {
    setFile(fileProp);
  });

  const onSaveFile = useMemoizedFn(async () => {
    await onUpdateMetric({
      file
    });
    openSuccessMessage(`${file_name} saved`);
  });

  useEffect(() => {
    setFile(fileProp);
  }, [fileProp]);

  return (
    <div className="relative h-full overflow-hidden p-3">
      <CodeCard
        code={file}
        language="yaml"
        fileName={file_name}
        onChange={setFile}
        onMetaEnter={onSaveFile}
      />

      <SaveResetFilePopup open={showPopup} onReset={onResetFile} onSave={onSaveFile} />
    </div>
  );
});

MetricViewFile.displayName = 'MetricViewFile';
