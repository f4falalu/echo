import { useCallback, useState } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';

export const useMetricViewChartContext = () => {
  return {};
};

export const MetricViewChartContext = createContext<ReturnType<typeof useMetricViewChartContext>>(
  {} as ReturnType<typeof useMetricViewChartContext>
);

export const MetricViewChartProvider = ({ children }: { children: React.ReactNode }) => {
  const value = useMetricViewChartContext();
  return (
    <MetricViewChartContext.Provider value={value}>{children}</MetricViewChartContext.Provider>
  );
};
