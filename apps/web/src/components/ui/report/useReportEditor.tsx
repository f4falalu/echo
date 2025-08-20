'use client';

import { type Value } from 'platejs';
import { useEditorRef, usePlateEditor, type TPlateEditor } from 'platejs/react';
import { useEffect, useMemo } from 'react';
import { EditorKit } from './editor-kit';
import { FIXED_TOOLBAR_KIT_KEY } from './plugins/fixed-toolbar-kit';
import { GlobalVariablePlugin } from './plugins/global-variable-kit';
import { useMount } from '@/hooks';

export const useReportEditor = ({
  value,
  disabled,
  isStreaming,
  mode = 'default',
  useFixedToolbarKit = false
}: {
  value: Value;
  disabled: boolean;
  useFixedToolbarKit?: boolean;
  isStreaming: boolean;
  mode?: 'export' | 'default';
}) => {
  const plugins = useMemo(() => {
    const filteredKeys: string[] = [];
    if (!useFixedToolbarKit) {
      filteredKeys.push(FIXED_TOOLBAR_KIT_KEY);
    }

    return [
      ...EditorKit,
      GlobalVariablePlugin.configure({
        options: { mode }
      })
    ].filter((p) => !filteredKeys.includes(p.key));
  }, []);

  useEffect(() => {
    if (editor && isStreaming) {
      console.log('setting value', value);
      editor.tf.setValue(value);
    }
  }, [value]);

  useMount(() => {
    setTimeout(() => {
      const lastPath = editor.api.end([]);
      console.log(lastPath, editor);

      editor.tf.insertNodes([{ type: 'p', children: [{ text: 'test' }] }], { at: lastPath });

      // Wait 500ms and then append additional text to the same node
      setTimeout(() => {
        const lastPath = editor.api.end([]);

        // Find the last block (paragraph) at that location
        const lastBlock = editor.api.block({ at: lastPath });

        if (lastBlock && lastBlock[0].type === 'p') {
          const [blockNode, blockPath] = lastBlock;

          // Get the end point of the block
          const endPoint = editor.api.end(blockPath);

          // Insert "WOW!" at the end
          editor.tf.insertText('WOW!', {
            at: endPoint
          });
        }
      }, 500);
    }, 3000);
  });

  const editor = usePlateEditor({
    plugins,
    value,
    readOnly: disabled || isStreaming
  });

  return editor;
};

export type ReportEditor = TPlateEditor<Value, (typeof EditorKit)[number]>;

export const useEditor = () => useEditorRef<ReportEditor>();
