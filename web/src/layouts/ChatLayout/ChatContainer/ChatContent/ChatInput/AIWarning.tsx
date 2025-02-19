import React from 'react';
import { Text } from '@/components/text';

export const AIWarning = React.memo(() => {
  return (
    <div className="w-full overflow-hidden truncate text-center">
      <Text size="xs" type="tertiary" className="truncate">
        Our AI may make mistakes. Check important info.
      </Text>
    </div>
  );
});

AIWarning.displayName = 'AIWarning';
