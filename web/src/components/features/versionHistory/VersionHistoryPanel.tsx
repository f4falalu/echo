import React from 'react';

export const VersionHistoryPanel = React.memo(
  ({ assetId, type }: { assetId: string; type: 'metric' | 'dashboard' }) => {
    return <div>VersionHistoryPanel</div>;
  }
);

VersionHistoryPanel.displayName = 'VersionHistoryPanel';
