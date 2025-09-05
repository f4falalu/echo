import type React from 'react';
import { AppTooltip } from '../tooltip';
import { Button } from './Button';

export const SelectableButton: React.FC<{
  tooltipText: string;
  tooltipShortcuts?: string[];
  icon: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  selected?: boolean;
}> = ({ tooltipText, tooltipShortcuts, icon, onClick, selected }) => {
  return (
    <AppTooltip title={tooltipText} shortcuts={tooltipShortcuts}>
      <Button
        color="default"
        selected={selected}
        variant={'ghost'}
        prefix={icon}
        onClick={onClick}
      />
    </AppTooltip>
  );
};

SelectableButton.displayName = 'SelectableButton';
