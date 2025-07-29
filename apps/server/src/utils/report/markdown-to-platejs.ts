import { MarkdownPlugin, remarkMdx, remarkMention } from '@platejs/markdown';
import { createSlateEditor } from 'platejs';
import { AutoformatPlugin } from '@platejs/autoformat';
import { ReportElementsSchema } from '@buster/server-shared/reports';
import {
  BaseBoldPlugin,
  BaseItalicPlugin,
  BaseH1Plugin,
  BaseH2Plugin,
  BaseH3Plugin,
  BaseH4Plugin,
  BaseH5Plugin,
  BaseH6Plugin,
  BaseBasicBlocksPlugin,
  BaseBasicMarksPlugin,
  BaseBlockquotePlugin,
  BaseCodePlugin,
  BaseHeadingPlugin,
  BaseHighlightPlugin,
  BaseHorizontalRulePlugin,
  BaseKbdPlugin,
  BaseStrikethroughPlugin,
  BaseSubscriptPlugin,
  BaseSuperscriptPlugin,
  BaseUnderlinePlugin
} from '@platejs/basic-nodes';
import { z } from 'zod';
import remarkGfm from 'remark-gfm';

const serverNode = [
  BaseBoldPlugin,
  BaseItalicPlugin,
  BaseH1Plugin,
  BaseH2Plugin,
  BaseH3Plugin,
  BaseH4Plugin,
  BaseH5Plugin,
  BaseH6Plugin,
  BaseBasicBlocksPlugin,
  BaseBasicMarksPlugin,
  BaseBlockquotePlugin,
  BaseCodePlugin,
  BaseHeadingPlugin,
  BaseHighlightPlugin,
  BaseHorizontalRulePlugin,
  BaseKbdPlugin,
  BaseStrikethroughPlugin,
  BaseSubscriptPlugin,
  BaseSuperscriptPlugin,
  BaseUnderlinePlugin,
  AutoformatPlugin,
  MarkdownPlugin.configure({
    options: {
      remarkPlugins: [remarkGfm, remarkMdx, remarkMention]
    }
  })
];

const SERVER_EDITOR = createSlateEditor({
  plugins: serverNode
});

export const markdownToPlatejs = async (markdown: string) => {
  const descendants = SERVER_EDITOR.api.markdown.deserialize(markdown);

  const safeParsedElements = ReportElementsSchema.safeParse(descendants);
  if (!safeParsedElements.success) {
    throw new Error('Failed to parse markdown to platejs');
  }

  return safeParsedElements.data;
};
