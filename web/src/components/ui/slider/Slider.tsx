'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { Tooltip } from '@/components/ui/tooltip';

import { cn } from '@/lib/utils';

export interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  min?: number;
  max?: number;
  step?: number;
  showTooltip?: boolean;
}

const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, SliderProps>(
  (
    {
      className,
      min = 0,
      max = 100,
      step = 1,
      showTooltip = true,
      value,
      defaultValue,
      onValueChange,
      ...props
    },
    ref
  ) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);
    const currentValue = value || defaultValue || [min];

    const handleValueChange = React.useCallback(
      (newValue: number[]) => {
        setIsDragging(true);
        onValueChange?.(newValue);
      },
      [onValueChange]
    );

    const handleValueCommit = React.useCallback(() => {
      setIsDragging(false);
    }, []);

    const renderThumb = (index: number) => {
      const thumbValue = currentValue[index];
      const shouldShowTooltip = showTooltip && (isDragging || isHovered);

      return (
        <Tooltip
          key={index}
          title={shouldShowTooltip ? String(thumbValue) : undefined}
          open={shouldShowTooltip}
          side="top"
          sideOffset={5}>
          <SliderPrimitive.Thumb
            className="border-primary/50 bg-background focus-visible:ring-ring block h-4 w-4 rounded-full border shadow transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          />
        </Tooltip>
      );
    };

    return (
      <SliderPrimitive.Root
        ref={ref}
        className={cn('relative flex w-full touch-none items-center select-none', className)}
        min={min}
        max={max}
        step={step}
        value={value}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        onValueCommit={handleValueCommit}
        {...props}>
        <SliderPrimitive.Track className="bg-primary/20 relative h-1.5 w-full grow overflow-hidden rounded-full">
          <SliderPrimitive.Range className="bg-primary absolute h-full" />
        </SliderPrimitive.Track>
        {Array.from({ length: currentValue.length }).map((_, index) => renderThumb(index))}
      </SliderPrimitive.Root>
    );
  }
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
