import type { InsertNodesOptions } from 'platejs';
import type { PlateEditor } from 'platejs/react';
import { CUSTOM_KEYS } from '../../config/keys';
import { MetricPlugin, type TMetricElement } from './metric-plugin';

export const insertMetric = (editor: PlateEditor, options?: InsertNodesOptions) => {
  editor.tf.insertNode<TMetricElement>(
    {
      type: CUSTOM_KEYS.metric,
      metricId: '',
      children: [{ text: '' }]
    },
    { select: true, ...options }
  );

  // Open the modal immediately after inserting the node
  // Small timeout to ensure the node is properly inserted and rendered
  setTimeout(() => {
    const plugin = editor.getPlugin(MetricPlugin);
    plugin.api.metric.openAddMetricModal();
  }, 50);
};
