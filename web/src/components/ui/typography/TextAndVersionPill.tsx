import { VersionPill } from '../tags/VersionPill';
import React from 'react';
import { Text } from './Text';

export const TextAndVersionPill = React.memo(
  ({ fileName, versionNumber }: { fileName: string; versionNumber: number }) => {
    return (
      <div className="flex items-center gap-1.5">
        <Text>{fileName}</Text>
        {versionNumber !== undefined && <VersionPill version_number={versionNumber} />}
      </div>
    );
  }
);

TextAndVersionPill.displayName = 'TextAndVersionPill';
