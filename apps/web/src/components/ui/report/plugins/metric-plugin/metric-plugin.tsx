import type { PluginConfig, TElement } from 'platejs';
import { createPlatePlugin } from 'platejs/react';
import { MetricElement } from './MetricElement';
import { CUSTOM_KEYS } from '../../config/keys';
import { useState, useEffect } from 'react';
import { AddMetricModal } from '@/components/features/modal/AddMetricModal';

export const MetricPlugin = createPlatePlugin({
  key: CUSTOM_KEYS.metric,
  options: {
    metricId: '',
    openModal: false
  },
  render: {},
  api: {
    openAddMetricModal: () => {
      //temp until we mount the component and override the api
    },
    closeAddMetricModal: () => {
      //temp until we mount the component and override the api
    }
  },
  node: {
    isElement: true,
    component: MetricElement
  }
});
