import { createPlatePlugin } from 'platejs/react';
import { MetricElement } from '../../elements/MetricElement/MetricElement';
import { CUSTOM_KEYS } from '../../config/keys';
import type { TElement } from 'platejs';

export type MetricPluginOptions = {
  openAddMetricModal: boolean;
};

export type MetricPluginApi = {
  openAddMetricModal: () => void;
  closeAddMetricModal: () => void;
  updateMetric: (metricId: string) => void;
};

export type TMetricElement = TElement & {
  type: typeof CUSTOM_KEYS.metric;
  metricId: string;
  children: [{ text: '' }];
};

export const MetricPlugin = createPlatePlugin<
  typeof CUSTOM_KEYS.metric,
  MetricPluginOptions,
  MetricPluginApi,
  TMetricElement
>({
  key: CUSTOM_KEYS.metric,
  options: {
    openAddMetricModal: false
  },
  node: {
    type: CUSTOM_KEYS.metric,
    isElement: true,
    component: MetricElement
  }
}).extendApi(({ setOption, plugin, editor, tf, ...rest }) => {
  return {
    openAddMetricModal: () => {
      setOption('openAddMetricModal', true);
    },
    closeAddMetricModal: () => {
      setOption('openAddMetricModal', false);
    },
    updateMetric: (metricId: string) => {
      tf.setNodes<TMetricElement>({ metricId });
    }
  };
});
