import { createPlatePlugin } from 'platejs/react';
import type { CUSTOM_KEYS } from '../../config/keys';
import type { TMetricElement } from './metric-kit';
import { MetricElementStatic } from '../../elements/MetricElement/MetricElementStatic';

export const MetricBaseKit = [
  createPlatePlugin<typeof CUSTOM_KEYS.metric, {}, {}, TMetricElement>({
    key: 'metric',
    node: {
      isElement: true,
      isVoid: false,
      component: MetricElementStatic
    }
  })
];
