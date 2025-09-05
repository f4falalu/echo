import { createPlatePlugin } from 'platejs/react';
import type { CUSTOM_KEYS } from '../../config/keys';
import { MetricElementStatic } from '../../elements/MetricElement/MetricElementStatic';
import type { TMetricElement } from './metric-kit';

export const MetricBaseKit = [
  // biome-ignore lint/complexity/noBannedTypes: it's cool
  createPlatePlugin<typeof CUSTOM_KEYS.metric, {}, {}, TMetricElement>({
    key: 'metric',
    node: {
      isElement: true,
      isVoid: false,
      component: MetricElementStatic,
    },
  }),
];
