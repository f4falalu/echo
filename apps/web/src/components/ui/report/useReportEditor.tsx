import { AnyPluginConfig, TrailingBlockPlugin, type Value } from 'platejs';
import {
  useEditorRef,
  usePlateEditor,
  type TPlateEditor,
  type WithPlateOptions
} from 'platejs/react';

// Plugin imports sorted alphabetically for clarity and maintainability
import { AIKit } from './plugins/ai-kit';
import { AlignKit } from './plugins/align-kit';
import { AutoformatKit } from './plugins/autoformat-kit';
import { BasicBlocksKit } from './plugins/basic-blocks-kit';
import { BasicMarksKit } from './plugins/basic-markd-kit';
import { BlockMenuKit } from './plugins/block-menu-kit';
import { BlockPlaceholderKit } from './plugins/block-placeholder-kit';
import { BlockSelectionKit } from './plugins/block-selection-kit';
import { CalloutKit } from './plugins/callout-kit';
import { CodeBlockKit } from './plugins/code-block-kit';
import { ColumnKit } from './plugins/column-kit';
import { CommentKit } from './plugins/comment-kit';
import { CursorOverlayKit } from './plugins/cursor-overlay-kit';
import { DateKit } from './plugins/date-kit';
import { DndKit } from './plugins/dnd-kit-new';
import { EmojiKit } from './plugins/emoji-kit';
import { ExitBreakKit } from './plugins/exit-break-kit';
import { FloatingToolbarKit } from './plugins/floating-toolbar-kit';
import { FontKit } from './plugins/font-kit';
import { LineHeightKit } from './plugins/line-height-kit';
import { LinkKit } from './plugins/link-kit';
import { ListKit } from './plugins/list-kit';
import { MarkdownKit } from './plugins/markdown-kit';
import { MathKit } from './plugins/math-kit';
import { MediaKit } from './plugins/media-kit';
import { MyTestPlugin } from './plugins/test-plugin';
import { SlashKit } from './plugins/slash-kit';
import { SuggestionKit } from './plugins/suggestion-kit';
import { TableKit } from './plugins/table-kit';
import { TocKit } from './plugins/toc-kit';
import { ToggleKit } from './plugins/toggle-kit';

export const editorPlugins: AnyPluginConfig[] = [
  // Core functionality (must be first)
  ...AIKit,
  ...BlockSelectionKit, // Required for drag and drop
  ...DndKit, // Drag and drop functionality

  // Elements
  ...BasicBlocksKit,
  ...CodeBlockKit,
  ...CalloutKit,
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

  //Block Styles
  ...AlignKit,
  ...ListKit,
  ...LineHeightKit,

  // Editing
  ...SlashKit,
  ...AutoformatKit,
  ...CursorOverlayKit,
  ...BlockMenuKit,
  ...DndKit,
  ...EmojiKit,
  ...ExitBreakKit,
  TrailingBlockPlugin,

  //Parsers
  ...MarkdownKit,

  //UI
  ...BlockPlaceholderKit,
  ...FloatingToolbarKit
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
