import { AnyPluginConfig, TrailingBlockPlugin, type Value } from 'platejs';
import {
  useEditorRef,
  usePlateEditor,
  type PlateEditor,
  type TPlateEditor,
  type WithPlateOptions
} from 'platejs/react';

// Plugin imports sorted alphabetically for clarity and maintainability
import { AlignKit } from './plugins/align-kit';
import { AutoformatKit } from './plugins/autoformat-kit';
import { BasicBlocksKit } from './plugins/basic-blocks-kit';
import { BasicMarksKit } from './plugins/basic-markd-kit';
import { BlockMenuKit } from './plugins/block-menu-kit';
import { BlockPlaceholderKit } from './plugins/block-placeholder-kit';
import { CalloutKit } from './plugins/callout-kit';
import { CodeBlockKit } from './plugins/code-block-kit';
import { ColumnKit } from './plugins/column-kit';
import { MyTestPlugin } from './plugins/test-plugin';
import { EmojiKit } from './plugins/emoji-kit';
import { TableKit } from './plugins/table-kit';
import { ToggleKit } from './plugins/toggle-kit';
import { TocKit } from './plugins/toc-kit';
import { MediaKit } from './plugins/media-kit';
import { MathKit } from './plugins/math-kit';
import { DateKit } from './plugins/date-kit';
import { LinkKit } from './plugins/link-kit';
import { FontKit } from './plugins/font-kit';
import { SlashKit } from './plugins/slash-kit';
import { SuggestionKit } from './plugins/suggestion-kit';
import { CursorOverlayKit } from './plugins/cursor-overlay-kit';
import { DndKit } from './plugins/dnd-kit';
import { FloatingToolbarKit } from './plugins/floating-toolbar-kit';
import { ExitBreakKit } from './plugins/exit-break-kit';
import { MarkdownKit } from './plugins/markdown-kit';

export const editorPlugins: AnyPluginConfig[] = [
  // Elements
  ...BasicBlocksKit,
  ...CodeBlockKit,
  ...CalloutKit,
  ...AlignKit,
  ...TableKit,
  ...ToggleKit,
  ...TocKit,
  ...MediaKit,
  ...MathKit,
  ...DateKit,
  ...ColumnKit,
  ...LinkKit,

  //Marks
  ...BasicMarksKit,
  ...FontKit,

  // Editing
  ...SlashKit,
  ...SuggestionKit,
  ...AutoformatKit,
  ...BlockMenuKit,
  ...CursorOverlayKit,
  ...DndKit,
  ...FloatingToolbarKit,
  ...EmojiKit,
  ...ExitBreakKit,

  TrailingBlockPlugin,

  //UI
  ...BlockPlaceholderKit,
  ...FloatingToolbarKit,

  //Markdown
  ...MarkdownKit
];

export const useReportEditor = ({
  value,
  disabled,
  onReady
}: {
  value: Value;
  disabled: boolean;
  onReady?: (ctx: WithPlateOptions) => void;
}) => {
  return usePlateEditor({
    plugins: editorPlugins,
    value,
    readOnly: disabled,
    onReady
  });
};

export type ReportEditor = TPlateEditor<Value, (typeof editorPlugins)[number]>;

export const useEditor = () => useEditorRef<ReportEditor>();
