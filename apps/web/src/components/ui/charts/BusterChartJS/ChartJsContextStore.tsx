import { Store, useStore } from '@tanstack/react-store';
import { useRef } from 'react';
import { setupChartJS } from './ChartJSTheme';

export const chartJsContextStore = new Store({
  hasSetupChartJS: false,
});

export const useChartJsContext = () => {
  return useStore(chartJsContextStore);
};

export const useSetupChartJS = () => {
  const { hasSetupChartJS } = useChartJsContext();
  const shouldSetupChartJS = useRef(!hasSetupChartJS);

  if (shouldSetupChartJS.current) {
    setupChartJS().then(() => {
      chartJsContextStore.setState({ hasSetupChartJS: true });
    });
    shouldSetupChartJS.current = false;
  }

  return hasSetupChartJS;
};
