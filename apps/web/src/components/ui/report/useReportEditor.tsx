import { AnyPluginConfig, type Value } from 'platejs';
import { useEditorRef, usePlateEditor, type TPlateEditor } from 'platejs/react';

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

export const editorPlugins: AnyPluginConfig[] = [
  // Elements
  ...BasicMarksKit,
  ...BasicBlocksKit,
  ...CodeBlockKit,
  ...CalloutKit,
  ...EmojiKit,
  ...AlignKit,
  ...TableKit,
  // ...ColumnKit

  // Editing
  ...AutoformatKit,
  ...BlockMenuKit,

  //UI
  ...BlockPlaceholderKit
];

export const useReportEditor = ({ value, disabled }: { value: Value; disabled: boolean }) => {
  return usePlateEditor({
    plugins: editorPlugins,
    value,
    enabled: !disabled
  });
};

export type ReportEditor = TPlateEditor<Value, (typeof editorPlugins)[number]>;

export const useEditor = () => useEditorRef<ReportEditor>();
