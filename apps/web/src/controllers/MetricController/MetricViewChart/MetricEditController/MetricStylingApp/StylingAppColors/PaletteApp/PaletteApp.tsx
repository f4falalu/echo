import React from 'react';
import type { BusterMetricChartConfig } from '@/api/asset_interfaces';
import { Text } from '@/components/ui/typography';

export const PaletteApp: React.FC<{
  colors: BusterMetricChartConfig['colors'];
}> = React.memo(({ colors }) => {
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center">
      <Text>Coming soon...</Text>
    </div>
  );
});
PaletteApp.displayName = 'PaletteApp';
