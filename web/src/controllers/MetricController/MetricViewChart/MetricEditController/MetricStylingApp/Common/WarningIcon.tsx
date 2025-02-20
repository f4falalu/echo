import { AppMaterialIcons } from '@/components/ui';
import { AppPopover } from '@/components/ui/tooltip';
import type { PopoverProps } from 'antd';
import { createStyles } from 'antd-style';
import React from 'react';

export const WarningIcon: React.FC<{
  rowCountThreshold?: number;
  rowCount: number;
  placement?: PopoverProps['placement'];
  warningText?: string;
}> = React.memo(
  ({
    rowCount,
    rowCountThreshold = 35,
    warningText = 'Data labels will be hidden if there are too many.',
    placement = 'left'
  }) => {
    const { styles, cx } = useStyles();

    if (rowCount <= rowCountThreshold) {
      return null;
    }
    return (
      <AppPopover
        placement={placement}
        trigger="click"
        content={<div className="max-w-[200px] p-2">{warningText}</div>}>
        <AppMaterialIcons className={cx(styles.warningIcon, 'cursor-pointer')} icon="warning" />
      </AppPopover>
    );
  }
);
WarningIcon.displayName = 'WarningIcon';

const useStyles = createStyles(({ css, token }) => ({
  warningIcon: css`
    color: ${token.colorTextTertiary};

    &:hover {
      color: ${token.colorTextSecondary};
    }
  `
}));
