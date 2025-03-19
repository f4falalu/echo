import React, { useEffect } from 'react';
import type { MetricViewProps } from '../config';
import { CodeCard } from '@/components/ui/card';
import { useMemoizedFn } from '@/hooks';
import { SaveResetFilePopup } from '@/components/features/popups/SaveResetFilePopup';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useGetMetric, useUpdateMetric } from '@/api/buster_rest/metrics';

export const MetricViewFile: React.FC<MetricViewProps> = React.memo(({ metricId }) => {
  const { data: metric } = useGetMetric({ id: metricId });
  const { openSuccessMessage } = useBusterNotifications();
  const { mutateAsync: updateMetric } = useUpdateMetric();

  const { file: fileProp, file_name } = metric || {};

  const [file, setFile] = React.useState(fileProp);

  const showPopup = file !== fileProp && !!file;

  const onResetFile = useMemoizedFn(() => {
    setFile(fileProp);
  });

  const onSaveFile = useMemoizedFn(async () => {
    await updateMetric({
      file,
      id: metricId
    });
    openSuccessMessage(`${file_name} saved`);
  });

  useEffect(() => {
    setFile(fileProp);
  }, [fileProp]);

  return (
    <div className="relative h-full overflow-hidden p-5">
      <CodeCard
        code={file || ''}
        language="yaml"
        fileName={file_name || ''}
        onChange={setFile}
        onMetaEnter={onSaveFile}
      />

      <SaveResetFilePopup open={showPopup} onReset={onResetFile} onSave={onSaveFile} />
    </div>
  );
});

MetricViewFile.displayName = 'MetricViewFile';
