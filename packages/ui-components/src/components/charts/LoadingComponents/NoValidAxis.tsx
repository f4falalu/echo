import { useMount } from '@/hooks/useMount';
import type { ChartType } from '@buster/server-shared/metrics';
import type React from 'react';
import { useMemo } from 'react';
import type { BusterChartProps } from '../BusterChart.types';

export const NoValidAxis: React.FC<{
  type: ChartType;
  onReady?: () => void;
  data: BusterChartProps['data'];
}> = ({ onReady, type }) => {
  const inValidChartText = useMemo(() => {
    if (!type) return 'No valid chart type';
    return 'No valid axis selected';
  }, [type]);

  useMount(() => {
    onReady?.();
  });

  return (
    <div className='flex h-full w-full items-center justify-center'>
      <span className='text-text-tertiary'>{inValidChartText}</span>
    </div>
  );
};
