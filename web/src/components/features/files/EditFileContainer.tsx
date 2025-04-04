import { CodeCard } from '@/components/ui/card/CodeCard';
import { SaveResetFilePopup } from '../popups/SaveResetFilePopup';
import React, { useEffect, useState } from 'react';
import { useMemoizedFn } from '@/hooks';

export const EditFileContainer: React.FC<{
  fileName: string | undefined;
  file: string | undefined;
  onSaveFile: () => void;
  error: string | undefined;
  isSaving: boolean | undefined;
  language?: string;
}> = React.memo(({ fileName, error, isSaving, file: fileProp, onSaveFile, language = 'yaml' }) => {
  const [file, setFile] = useState(fileProp);

  const showPopup = file !== fileProp && !!file;

  const onResetFile = useMemoizedFn(() => {
    setFile(fileProp);
  });

  useEffect(() => {
    setFile(fileProp);
  }, [fileProp]);

  return (
    <div className="relative h-full overflow-hidden p-5">
      <CodeCard
        code={file || ''}
        language={language}
        fileName={fileName || ''}
        onChange={setFile}
        onMetaEnter={onSaveFile}
        error={error}
      />

      <SaveResetFilePopup
        open={showPopup}
        onReset={onResetFile}
        onSave={onSaveFile}
        isSaving={isSaving}
        showHotsKeys
      />
    </div>
  );
});

EditFileContainer.displayName = 'EditFileContainer';
