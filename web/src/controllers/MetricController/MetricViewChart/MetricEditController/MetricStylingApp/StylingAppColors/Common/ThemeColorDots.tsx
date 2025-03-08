import { cn } from '@/lib/classMerge';
import React from 'react';

export const ThemeColorDots: React.FC<{ colors: string[]; numberOfColors?: number | 'all' }> = ({
  colors,
  numberOfColors = 'all'
}) => {
  const numberOfColorsToShow = numberOfColors === 'all' ? colors.length : numberOfColors;

  return (
    <div className="flex shrink-0 items-center gap-0">
      {colors.slice(0, numberOfColorsToShow).map((color, colorIdx) => (
        <div
          key={colorIdx}
          className={cn(
            'ball rounded-full',
            colorIdx > 0 && '-ml-0.5 h-2 w-2 shadow-[0_0_0_0.75px]'
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
};
ThemeColorDots.displayName = 'ThemeColorDots';
