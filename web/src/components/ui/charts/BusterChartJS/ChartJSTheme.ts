'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Colors,
  LogarithmicScale,
  TimeScale,
  TimeSeriesScale,
  PointElement,
  LineController,
  BarController,
  BubbleController,
  PieController,
  ScatterController,
  DoughnutController
} from 'chart.js';
import { ChartMountedPlugin } from './core/plugins';
import ChartDeferred from 'chartjs-plugin-deferred';
import ChartJsAnnotationPlugin from 'chartjs-plugin-annotation';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { DEFAULT_CHART_THEME } from '@/api/asset_interfaces/metric/charts/configColors';
import { isServer } from '@tanstack/react-query';

import 'chartjs-adapter-dayjs-4';

const fontFamily = isServer
  ? 'Roobert_Pro'
  : getComputedStyle(document.documentElement).getPropertyValue('--font-sans');
const color = isServer
  ? '#575859'
  : getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary');

ChartJS.register(
  LineController,
  BarController,
  BubbleController,
  PieController,
  ScatterController,
  DoughnutController,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Colors,
  ArcElement,
  ChartDeferred,
  ChartMountedPlugin,
  Legend,
  CategoryScale,
  LinearScale,
  ChartJsAnnotationPlugin,
  Tooltip,
  LinearScale,
  LogarithmicScale,
  TimeScale,
  TimeSeriesScale,
  ChartDataLabels
);

ChartJS.defaults.responsive = true;
ChartJS.defaults.resizeDelay = 100;
ChartJS.defaults.maintainAspectRatio = false;
ChartJS.defaults.color = color;
ChartJS.defaults.backgroundColor = DEFAULT_CHART_THEME;
ChartJS.defaults.font = {
  ...ChartJS.defaults.font,
  family: fontFamily,
  size: 12,
  weight: 'normal'
};

export const DEFAULT_CHART_LAYOUT = {
  autoPadding: true,
  padding: {
    top: 14,
    bottom: 0,
    left: 4,
    right: 4
  }
};

ChartJS.defaults.layout = {
  ...ChartJS.defaults.layout,
  ...DEFAULT_CHART_LAYOUT
};
ChartJS.defaults.normalized = true;

ChartJS.defaults.plugins = {
  ...ChartJS.defaults.plugins,
  legend: {
    ...ChartJS.defaults.plugins.legend,
    display: false
  },
  datalabels: {
    ...ChartJS.defaults.plugins.datalabels,
    clamp: true,
    display: false,
    font: {
      weight: 'normal',
      size: 10,
      family: fontFamily
    }
  },
  tooltipHoverBar: {
    isDarkMode: false
  }
};

//PIE SPECIFIC
ChartJS.overrides.pie = {
  ...ChartJS.overrides.pie,
  hoverBorderColor: 'white',
  layout: {
    autoPadding: true,
    padding: 35
  },
  elements: {
    ...ChartJS.overrides.pie?.elements,
    arc: {
      ...ChartJS.overrides.pie?.elements?.arc,
      hoverOffset: 0,
      borderRadius: 5,
      borderWidth: 2.5,
      borderAlign: 'center',
      borderJoinStyle: 'round'
    }
  }
};

//BAR SPECIFIC
ChartJS.overrides.bar = {
  ...ChartJS.overrides.bar,
  elements: {
    ...ChartJS.overrides.bar?.elements,
    bar: {
      ...ChartJS.overrides.bar?.elements?.bar,
      borderRadius: 4
    }
  }
};

//LINE SPECIFIC
ChartJS.overrides.line = {
  ...ChartJS.overrides.line,
  elements: {
    ...ChartJS.overrides.line?.elements,
    line: {
      ...ChartJS.overrides.line?.elements?.line,
      borderWidth: 2
    }
  }
};
