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
  serialize: (node: MetricElement, options) => {
    const width = node.width;
    const metricId = node.metricId;

    if (!options.editor) {
      throw new Error('Editor is required');
    }

    return {
      type: 'html',
      value: `<metric metricId="${metricId}" width="${width}"></metric>`,
    };
  },
  deserialize: (node): MetricElement => {
    // Extract the icon attribute from the HTML element
    const typedAttributes = parseAttributes(node.attributes) as {
      metricId: string;
      width: string | number;
    };

    // Return the PlateJS node structure
    return {
      type: 'metric',
      metricId: typedAttributes.metricId,
      width: typedAttributes.width,
      children: [{ text: '' }],
    };
  },
};
