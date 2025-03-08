import { AppSegmented } from '@/components/ui/segmented';
import { useMemoizedFn } from '@/hooks';
import { type SegmentedItem } from '@/components/ui/segmented';
import React from 'react';
import { cn } from '@/lib/classMerge';

export enum EditorApps {
  PREVIEW = 'preview',
  METADATA = 'metadata'
}

const options = [
  { label: 'SQL', value: EditorApps.PREVIEW },
  { label: 'Metadata', value: EditorApps.METADATA }
];

export const EditorContainerSubHeader: React.FC<{
  selectedApp: EditorApps;
  setSelectedApp: (app: EditorApps) => void;
}> = React.memo(({ selectedApp, setSelectedApp }) => {
  const onSegmentedChange = useMemoizedFn((value: SegmentedItem<EditorApps>) => {
    setSelectedApp(value.value);
  });

  return (
    <div
      className={cn(
        'bg-disabled h-[36px] w-full border-b',
        'flex items-center justify-between px-4'
      )}>
      <AppSegmented options={options} value={selectedApp} onChange={onSegmentedChange} />
    </div>
  );
});

EditorContainerSubHeader.displayName = 'EditorContainerSubHeader';
