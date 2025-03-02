'use client';

import { motion } from 'framer-motion';
import React, { useMemo } from 'react';

interface ShimmerText2Props {
  text: string;
  colors?: string[];
  duration?: number;
  fontSize?: number;
}

const animate = {
  backgroundPosition: ['200% 50%', '0% 50%']
};

export const ShimmerText: React.FC<ShimmerText2Props> = React.memo(
  ({
    text,
    colors = ['var(--color-foreground)', 'var(--color-text-tertiary)'],
    duration = 1.5,
    fontSize = 13
  }) => {
    if (colors.length < 2) {
      throw new Error('ShimmerText requires at least 2 colors');
    }

    const gradientColors = [...colors, colors[0]].join(', ');

    const memoizedStyle: React.CSSProperties = useMemo(() => {
      return {
        position: 'relative',
        display: 'inline-block',
        background: `linear-gradient(90deg, ${gradientColors})`,
        backgroundSize: '200% 100%',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontSize: fontSize
      };
    }, [gradientColors]);

    const memoizedTransition = useMemo(() => {
      return {
        duration,
        repeat: Infinity,
        ease: 'linear'
      };
    }, [duration]);

    return (
      <>
        <motion.div
          className="shimmer-text"
          style={memoizedStyle}
          animate={animate}
          transition={memoizedTransition}>
          {text}
        </motion.div>
      </>
    );
  }
);

ShimmerText.displayName = 'ShimmerText';
