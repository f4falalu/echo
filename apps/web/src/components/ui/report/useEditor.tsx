import { AnyPluginConfig, type Value } from 'platejs';
import { CodePlugin } from '@platejs/basic-nodes/react';
import { CalloutPlugin } from '@platejs/callout/react';
import { KEYS } from 'platejs';
import { AutoformatPlugin } from '@platejs/autoformat';

import { usePlateEditor } from 'platejs/react';
import { BasicBlocksKit } from './plugins/basic-blocks-kit';
import { BaseBasicMarksKit } from './plugins/basic-markd-kit';
import { CodeBlockKit } from './plugins/code-block-kit';

export const editorPlugins: AnyPluginConfig[] = [
  ...BaseBasicMarksKit,
  ...BasicBlocksKit,
  ...CodeBlockKit,
  CalloutPlugin,
  CodePlugin,
  AutoformatPlugin.configure({
    options: {
      rules: [
        // Horizontal Rule
        {
          mode: 'block',
          type: KEYS.hr,
          match: ['---', '—-', '___ '],
          format: (editor) => {
            editor.tf.setNodes({ type: KEYS.hr });
            editor.tf.insertNodes({
              children: [{ text: '' }],
              type: KEYS.p
            });
          }
        }
      ]
    }
  })
];

export const useEditor = ({ value, disabled }: { value: Value; disabled: boolean }) => {
  return usePlateEditor({
    plugins: editorPlugins,
    value,
    enabled: !disabled
  });
};
