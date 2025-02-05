import React from 'react';

import { Button, ButtonProps } from 'antd';
import { AppMaterialIconIcon, AppMaterialIcons, AppTooltip } from '@/components';

export const SelectableButton = React.memo<{
  tooltipText: string;
  tooltipShortcuts?: string[];
  icon: AppMaterialIconIcon;
  onClick: () => void;
  selected?: boolean;
}>(({ tooltipText, tooltipShortcuts, icon, onClick, selected }) => {
  const buttonVariant: ButtonProps['variant'] = selected ? 'filled' : 'text';

  return (
    <AppTooltip title={tooltipText} shortcuts={tooltipShortcuts}>
      <Button
        color="default"
        variant={buttonVariant}
        icon={<AppMaterialIcons icon={icon} />}
        onClick={onClick}
      />
    </AppTooltip>
  );
});

SelectableButton.displayName = 'SelectableButton';
