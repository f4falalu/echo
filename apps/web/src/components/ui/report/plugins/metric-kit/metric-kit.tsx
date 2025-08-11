import { createPlatePlugin } from 'platejs/react';
import { MetricElement } from '../../elements/MetricElement/MetricElement';
import { CUSTOM_KEYS } from '../../config/keys';
import type { SetNodesOptions, TElement } from 'platejs';

export type MetricPluginOptions = {
  openMetricModal: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type MetricPluginApi = {
  // the methods are defined in the extendApi function
};

export type TMetricElement = TElement & {
  type: typeof CUSTOM_KEYS.metric;
  metricId: string;
  metricVersionNumber: number | undefined;
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
    openMetricModal: false
  },
  node: {
    type: CUSTOM_KEYS.metric,
    isElement: true,
    isVoid: true,
    component: MetricElement
  },
  rules: {
    break: {
      default: 'exit',
      empty: 'exit',
      emptyLineEnd: 'exit'
    }
  }
}).extendApi(({ setOption, plugin, editor, tf, ...rest }) => {
  return {
    openAddMetricModal: () => {
      setOption('openMetricModal', true);
    },
    closeAddMetricModal: () => {
      setOption('openMetricModal', false);
    },
    updateMetric: (metricId: string, options?: SetNodesOptions<TMetricElement[]>) => {
      tf.setNodes<TMetricElement>({ metricId }, options);
    }
  };
});

export const MetricKit = [MetricPlugin];
