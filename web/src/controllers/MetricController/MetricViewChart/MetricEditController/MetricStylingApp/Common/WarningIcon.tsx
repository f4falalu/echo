import { AlertWarning } from '@/components/ui/icons';
import { createStyles } from 'antd-style';
import React from 'react';
import { cn } from '@/lib/classMerge';
import { Popover } from '@/components/ui/tooltip/Popover';

export const WarningIcon: React.FC<{
  rowCountThreshold?: number;
  rowCount: number;

  warningText?: string;
}> = React.memo(
  ({
    rowCount,
    rowCountThreshold = 35,
    warningText = 'Data labels will be hidden if there are too many.'
  }) => {
    const { styles, cx } = useStyles();

    if (rowCount <= rowCountThreshold) {
      return null;
    }
    return (
      <Popover
        side="left"
        align="center"
        content={<div className="max-w-[200px]">{warningText}</div>}>
        <div className={cn(styles.warningIcon, 'cursor-pointer')}>
          <AlertWarning />
        </div>
      </Popover>
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
