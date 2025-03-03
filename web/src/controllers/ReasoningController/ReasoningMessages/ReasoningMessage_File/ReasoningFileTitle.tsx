import React from 'react';
import { Text } from '@/components/ui';
import { VersionPill } from '@/components/ui/tags/VersionPill';

export const ReasoningFileTitle = React.memo(
  ({ file_name, version_number }: { file_name: string; version_number: number }) => {
    return (
      <div className="flex items-center gap-1.5">
        <Text>{file_name}</Text>
        {version_number && <VersionPill version_number={version_number} />}
      </div>
    );
  }
);

ReasoningFileTitle.displayName = 'ReasoningFileTitle';
