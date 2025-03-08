import { AppCodeEditor } from '@/components/ui/inputs/AppCodeEditor';
import { cn } from '@/lib/classMerge';
import React from 'react';

export const MetadataContainer: React.FC<{
  ymlFile: string;
  setYmlFile: (ymlFile: string) => void;
}> = React.memo(({ ymlFile, setYmlFile }) => {
  return (
    <div
      className={cn('bg-background rounded border', 'flex h-full w-full flex-col overflow-hidden')}>
      <AppCodeEditor
        language="yaml"
        className="overflow-hidden"
        value={ymlFile}
        onChange={setYmlFile}
      />
    </div>
  );
});

MetadataContainer.displayName = 'MetadataContainer';
