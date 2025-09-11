import { MarkdownPlugin as PlateMarkdownPlugin, remarkMdx, remarkMention } from '@platejs/markdown';
import remarkGfm from 'remark-gfm';
import { calloutSerializer } from './callout-serializer';
import { metricSerializer } from './metric-serializer';
import { toggleSerializer } from './toggle-serializer';

const MarkdownPlugin = PlateMarkdownPlugin.configure({
  options: {
    remarkPlugins: [remarkGfm, remarkMdx, remarkMention],
    rules: {
      callout: calloutSerializer,
      metric: metricSerializer,
      toggle: toggleSerializer,
      details: toggleSerializer,
    },
  },
});

export const MarkdownKit = [MarkdownPlugin];
