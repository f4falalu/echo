import { AnyPluginConfig, type Value } from 'platejs';
import { usePlateEditor } from 'platejs/react';
import { BasicBlocksKit } from './plugins/basic-blocks-kit';
import { BasicMarksKit } from './plugins/basic-markd-kit';
import { CodeBlockKit } from './plugins/code-block-kit';
import { CalloutKit } from './plugins/callout-kit';
import { MyTestPlugin } from './plugins/test-plugin';
import { AlignKit } from './plugins/align-kit';
import { AutoformatKit } from './plugins/autoformat-kit';
import { BlockMenuKit } from './plugins/block-menu-kit';
import { BlockSelectionKit } from './plugins/block-selection-kit';
import { BlockPlaceholderKit } from './plugins/block-placeholder-kit';
import { ColumnKit } from './plugins/column-kit';

export const editorPlugins: AnyPluginConfig[] = [
  ...BasicMarksKit,
  ...BasicBlocksKit,
  ...CodeBlockKit,
  ...CalloutKit
  // ...AlignKit,
  // ...AutoformatKit,
  // ...BlockMenuKit,
  // ...BlockSelectionKit,
  // ...BlockPlaceholderKit,
  // ...ColumnKit
];

export const useEditor = ({ value, disabled }: { value: Value; disabled: boolean }) => {
  return usePlateEditor({
    plugins: editorPlugins,
    value,
    enabled: !disabled
  });
};
