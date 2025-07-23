'use client';

import { cn } from '@/lib/classMerge';
import React from 'react';
interface ShimmerTextProps {
  text: string;
  colors?: string[];
  duration?: number;
  fontSize?: number;
  className?: string;
}

export const ShimmerText: React.FC<ShimmerTextProps> = React.memo(
  ({
    text,
    colors = ['var(--color-foreground)', 'var(--color-text-tertiary)'],
    duration = 1.5,
    fontSize = 13,
    className = '',
  }) => {
    if (colors.length < 2) {
      throw new Error('ShimmerText requires at least 2 colors');
    }

    const gradientColors = [...colors, colors[0]].join(', ');

    return (
      <div
        className={cn(
          'inline-block animate-shimmer bg-[length:200%_100%] bg-clip-text text-transparent',
          className
        )}
        style={{
          backgroundImage: `linear-gradient(90deg, ${gradientColors})`,
          fontSize: fontSize,
          animationDuration: `${duration}s`,
        }}
      >
        {text}
      </div>
    );
  }
);

ShimmerText.displayName = 'ShimmerText';
