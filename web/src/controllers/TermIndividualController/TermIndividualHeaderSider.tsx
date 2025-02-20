import React from 'react';

import { AppMaterialIcons, AppTooltip, AppTooltipProps } from '@/components/ui';
import { Text } from '@/components/ui';

const memoizedTrigger: AppTooltipProps['trigger'] = ['click'];

export const TermIndividualHeaderSider: React.FC = () => {
  return (
    <div className="flex h-full w-full items-center justify-between">
      <Text>Details</Text>
      <div className="flex h-full items-center">
        <AppTooltip trigger={memoizedTrigger} title="Edit">
          <Text className="flex h-full! cursor-pointer items-center">
            <AppMaterialIcons size={18} icon="help" />
          </Text>
        </AppTooltip>
      </div>
    </div>
  );
};
