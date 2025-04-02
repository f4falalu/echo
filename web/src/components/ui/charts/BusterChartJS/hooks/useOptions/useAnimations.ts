import { useMemo } from 'react';
import { barDelayAnimation } from '../../core/animations/barDelayAnimation';
import { ANIMATION_DURATION, ANIMATION_THRESHOLD } from '../../../config';
import { AnimationOptions, ChartType as ChartTypeJS } from 'chart.js';
import { ChartType } from '@/api/asset_interfaces/metric';

export const useAnimations = ({
  animate,
  numberOfSources,
  chartType
}: {
  animate: boolean;
  numberOfSources: number;
  chartType: ChartType;
}): AnimationOptions<ChartTypeJS>['animation'] => {
  const isAnimationEnabled = useMemo(() => {
    return animate && numberOfSources <= ANIMATION_THRESHOLD;
  }, [animate, numberOfSources]);

  return useMemo(() => {
    return isAnimationEnabled
      ? {
          duration: ANIMATION_DURATION,
          ...animationRecord[chartType]?.()
        }
      : false;
  }, [isAnimationEnabled, chartType]);
};

const animationRecord: Record<ChartType, () => AnimationOptions<ChartTypeJS>['animation']> = {
  bar: barDelayAnimation,
  line: () => ({}),
  scatter: () => ({}),
  pie: () => ({}),
  metric: () => ({}),
  table: () => ({}),
  combo: () => ({})
};
