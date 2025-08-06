import type { PluginConfig, TElement } from 'platejs';
import { createPlatePlugin } from 'platejs/react';
import { MetricElement } from './MetricElement';
import { CUSTOM_KEYS } from '../../config/keys';

export const MetricPlugin = createPlatePlugin({
  key: CUSTOM_KEYS.metric,
  api: {},
  options: {
    metricId: ''
  },
  node: {
    isElement: true,
    component: MetricElement
  }
});

export const TestMetricPlugin = createPlatePlugin({
  key: 'test-metric',
  api: {},
  options: {},
  node: {
    component: (props) => {
      return <div>Test Metric</div>;
    }
  }
});
