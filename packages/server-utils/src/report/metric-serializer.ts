import type { MetricElement } from '@buster/database';
import {
  type DeserializeMdOptions,
  type MdDecoration,
  type MdNodeParser,
  type MdRules,
  convertChildrenDeserialize,
  parseAttributes,
  serializeMd,
} from '@platejs/markdown';

type MetricMdNode = MdRules['metric'];

export const metricSerializer: MetricMdNode = {
  serialize: (node, options) => {
    console.log('node', node);

    const typedAttributes = parseAttributes(node.attributes) as {
      metricId: string;
    };

    // Extract the icon from the node (assuming it's stored as an attribute)
    const icon = typedAttributes.metricId || '💡';

    if (!options.editor) {
      throw new Error('Editor is required');
    }

    const content = serializeMd(options.editor, {
      ...options,
      value: node.children,
    });

    return {
      type: 'html',
      value: `<metric metricId="${icon}">${content}</metric>`,
    };
  },
  deserialize: (node): MetricElement => {
    // Extract the icon attribute from the HTML element
    const typedAttributes = parseAttributes(node.attributes) as {
      metricId: string;
    };

    // Return the PlateJS node structure
    return {
      type: 'metric',
      metricId: typedAttributes.metricId,
      children: [{ text: '' }],
    };
  },
};
