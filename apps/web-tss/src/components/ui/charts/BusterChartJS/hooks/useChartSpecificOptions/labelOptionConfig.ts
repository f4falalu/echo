'use client';

import { isServer } from '@/lib/window';
import type { ChartProps } from '../../core';

export const defaultLabelOptionConfig = {
  backgroundColor: isServer
    ? '#e6e6e6'
    : getComputedStyle(document.documentElement).getPropertyValue('--color-page-background'),
  borderWidth: 0.5,
  borderColor: isServer
    ? '#e0e0e0'
    : getComputedStyle(document.documentElement).getPropertyValue('--color-border'),
  borderRadius: 6,
  padding: {
    top: 3,
    bottom: 3,
    left: 6,
    right: 6,
  },
  color: isServer
    ? '#575859'
    : getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary'),
  font: {
    size: 10,
    weight: 'normal' as const,
  },
} satisfies ChartProps<'line'>['data']['datasets'][number]['datalabels'];
