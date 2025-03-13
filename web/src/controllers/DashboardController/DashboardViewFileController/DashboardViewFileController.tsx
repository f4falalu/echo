import React, { useEffect } from 'react';
import { CodeCard } from '@/components/ui/card';
import { useMemoizedFn } from '@/hooks';
import { SaveResetFilePopup } from '@/components/features/popups/SaveResetFilePopup';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { DashboardViewProps } from '../config';
import { useBusterDashboardIndividual } from '@/context/Dashboards';
import { useUpdateDashboard } from '@/api/buster_rest/dashboards';

export const DashboardViewFileController: React.FC<DashboardViewProps> = React.memo(
  ({ dashboardId }) => {
    const { dashboard } = useBusterDashboardIndividual({ dashboardId });
    const { openSuccessMessage } = useBusterNotifications();
    const { mutateAsync: onUpdateDashboard } = useUpdateDashboard();

    const { file: fileProp, file_name } = dashboard || {};

    const [file, setFile] = React.useState(fileProp);

    const showPopup = file !== fileProp && !!file;

    const onResetFile = useMemoizedFn(() => {
      setFile(fileProp);
    });

    const onSaveFile = useMemoizedFn(async () => {
      await onUpdateDashboard({
        file,
        id: dashboardId
      });
      openSuccessMessage(`${file_name} saved`);
    });

    useEffect(() => {
      setFile(fileProp);
    }, [fileProp]);

    return (
      <div className="relative h-full overflow-hidden p-3">
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
  }
);

DashboardViewFileController.displayName = 'DashboardViewFile';
