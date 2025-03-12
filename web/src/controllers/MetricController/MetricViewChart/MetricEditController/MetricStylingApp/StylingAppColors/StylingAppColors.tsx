import React, { useState } from 'react';
import { StylingAppColorsTab } from './config';
import { SelectColorApp } from './SelectColorApp';
import { AnimatePresence, motion } from 'framer-motion';
import { CustomApp } from './CustomApp';
import { PaletteApp } from './PaletteApp';
import { ColorsApp } from './ColorsApp';
import { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { useBusterMetricsContextSelector } from '@/context/Metrics';
import { useMemoizedFn } from '@/hooks';

export const StylingAppColors: React.FC<{
  className: string;
  colors: IBusterMetricChartConfig['colors'];
}> = ({ className, colors }) => {
  const [selectedTab, setSelectedTab] = useState<StylingAppColorsTab>(StylingAppColorsTab.Colors);

  const onUpdateMetricChartConfig = useBusterMetricsContextSelector(
    (x) => x.onUpdateMetricChartConfig
  );

  const onUpdateChartConfig = useMemoizedFn((chartConfig: Partial<IBusterMetricChartConfig>) => {
    onUpdateMetricChartConfig({ chartConfig });
  });

  return (
    <div className="mt-3 flex flex-col space-y-2">
      <div className={className}>
        <SelectColorApp selectedTab={selectedTab} onChange={setSelectedTab} />
      </div>

      <div className={className}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={selectedTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.11 }}>
            {selectedTab === StylingAppColorsTab.Colors && (
              <ColorsApp colors={colors} onUpdateChartConfig={onUpdateChartConfig} />
            )}
            {selectedTab === StylingAppColorsTab.Palettes && <PaletteApp colors={colors} />}
            {selectedTab === StylingAppColorsTab.Custom && <CustomApp />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
