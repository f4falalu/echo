import React, { useMemo } from 'react';
import { DEFAULT_COLUMN_LABEL_FORMAT } from '@buster/server-shared/metrics';
import type { ColumnLabelFormat } from '@buster/server-shared/metrics';
import { Text } from '@/components/ui/typography';
import { formatLabel } from '@/lib';
import { cn } from '@/lib/classMerge';
import { ColumnTypeIcon } from './config';

export const SelectAxisItemLabel = React.memo(
  ({
    id,
    columnLabelFormat,
    onClick
  }: {
    id: string;
    columnLabelFormat: ColumnLabelFormat | undefined;
    onClick?: () => void;
  }) => {
    const { style } = columnLabelFormat || DEFAULT_COLUMN_LABEL_FORMAT;

    const label = useMemo(() => {
      return formatLabel(id, columnLabelFormat, true);
    }, [columnLabelFormat, id]);

    const Icon = useMemo(() => ColumnTypeIcon[style] || ColumnTypeIcon.string, [style]);

    return (
      <button
        type="button"
        className={cn(
          'flex items-center space-x-1.5 overflow-hidden whitespace-nowrap',
          onClick && 'cursor-pointer'
        )}
        onClick={onClick}
        onKeyDown={(e) => e.key === 'Enter' && onClick?.()}>
        <div className={cn('text-icon-color flex')}>{Icon.icon}</div>
        <Text className="truncate">{label}</Text>
      </button>
    );
  }
);
SelectAxisItemLabel.displayName = 'SelectAxisItemLabel';
