import { CodeCard } from '@/components/ui/card/CodeCard';
import { SaveResetFilePopup } from '../popups/SaveResetFilePopup';
import React, { useEffect, useState } from 'react';
import { useMemoizedFn } from '@/hooks';

export const EditFileContainer: React.FC<{
  fileName: string | undefined;
  file: string | undefined;
  onSaveFile: (file: string) => void;
  error: string | undefined;
  isSaving: boolean | undefined;
  language?: string;
}> = React.memo(
  ({ fileName, error, isSaving, file: fileProp = '', onSaveFile, language = 'yaml' }) => {
    const [file, setFile] = useState<string>(fileProp || '');

    const showPopup = file !== fileProp && !!file;

    const onResetFile = useMemoizedFn(() => {
      setFile(fileProp || '');
    });

    const onSaveFilePreflight = useMemoizedFn(() => {
      onSaveFile(file);
    });

    useEffect(() => {
      setFile(fileProp || '');
    }, [fileProp]);

    return (
      <div className="relative h-full overflow-hidden p-5">
        <CodeCard
          code={file || ''}
          language={language}
          fileName={fileName || ''}
          onChange={setFile}
          onMetaEnter={onSaveFilePreflight}
          error={error}
        />

        <SaveResetFilePopup
          open={showPopup}
          onReset={onResetFile}
          onSave={onSaveFilePreflight}
          isSaving={isSaving}
          showHotsKeys
        />
      </div>
    );
  }
);

EditFileContainer.displayName = 'EditFileContainer';
