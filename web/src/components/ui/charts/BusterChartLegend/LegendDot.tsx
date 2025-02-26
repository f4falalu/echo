import React, { useMemo } from 'react';
import { useMemoizedFn } from 'ahooks';
import { type BusterChartLegendItem } from './interfaces';
import { ChartType } from '../interfaces';
import { Target } from '../../icons';
import { cn } from '@/lib/classMerge';
import { cva, type VariantProps } from 'class-variance-authority';

const itemVariants = cva(
  'dot group relative flex items-center justify-center transition-all duration-300',
  {
    variants: {
      size: {
        sm: 'w-[8px] h-[12px]',
        default: 'w-[18px] h-[12px]'
      }
    }
  }
);

const dotVariants = cva('bg-border transition-colors duration-100', {
  variants: {
    size: {
      sm: '',
      default: ''
    },
    type: {
      bar: 'w-[18px] h-[12px] rounded-sm',
      line: 'w-[18px] h-[4px] rounded-sm',
      scatter: 'w-[12px] h-[12px] rounded-full'
    }
  },

  compoundVariants: [
    {
      size: 'sm',
      type: 'bar',
      className: 'w-[8px] h-[8px] rounded-[1.5px]'
    },
    {
      size: 'sm',
      type: 'line',
      className: 'w-[8px] h-[2px] rounded-1.5px'
    },
    {
      size: 'sm',
      type: 'scatter',
      className: 'w-[8px] h-[8px]'
    }
  ]
});
export const LegendItemDot: React.FC<
  {
    color: string | undefined;
    inactive: boolean;
    type: BusterChartLegendItem['type'];
    onFocusItem?: () => void;
  } & VariantProps<typeof itemVariants>
> = React.memo(({ color, type, inactive, onFocusItem, size = 'default' }) => {
  const hasFocusItem = onFocusItem !== undefined;

  const onClick = useMemoizedFn((e: React.MouseEvent<HTMLDivElement>) => {
    if (onFocusItem) {
      e.stopPropagation();
      onFocusItem();
    }
  });

  const onFocusItemPreflight = useMemoizedFn((e: React.MouseEvent<HTMLDivElement>) => {
    if (onFocusItem) {
      e.stopPropagation();
      e.preventDefault();
      onFocusItem();
    }
  });

  const dotStyle = useMemo(() => {
    if (type === ChartType.Line) return dotVariants({ size, type: 'line' });
    if (type === ChartType.Scatter) return dotVariants({ size, type: 'scatter' });
    return dotVariants({ size, type: 'bar' });
  }, [type, size]);

  return (
    <div className={cn(itemVariants({ size }))}>
      <div
        onClick={onClick}
        className={cn(dotStyle, dotVariants({ size }), {
          'group-hover:opacity-0': hasFocusItem
        })}
        style={{ backgroundColor: !inactive ? color : undefined }}></div>
      {hasFocusItem && (
        <div
          onClick={onFocusItemPreflight}
          className="absolute hidden h-full w-full items-center justify-center overflow-hidden group-hover:flex">
          <div className="focus-item group-hover:bg-item-hover flex h-full w-full items-center justify-center rounded-sm">
            <div
              className={cn(
                'flex h-full w-full items-center justify-center overflow-hidden',
                size === 'sm' ? 'text-xxs' : 'text-xxs'
              )}>
              <Target />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
LegendItemDot.displayName = 'LegendItemDot';
