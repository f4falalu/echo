'use client';

import { type Value } from 'platejs';
import { useEditorRef, usePlateEditor, type TPlateEditor } from 'platejs/react';
import { useEffect, useMemo } from 'react';
import { EditorKit } from './editor-kit';
import { FIXED_TOOLBAR_KIT_KEY } from './plugins/fixed-toolbar-kit';
import { GlobalVariablePlugin } from './plugins/global-variable-kit';
import { StreamContentPlugin } from './plugins/stream-content-plugin';
import type { ReportElementsWithIds } from '@buster/server-shared/reports';

export const useReportEditor = ({
  value,
  disabled,
  isStreaming,
  mode = 'default',
  useFixedToolbarKit = false
}: {
  value: ReportElementsWithIds;
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
      const streamContentPlugin = editor.getPlugin(StreamContentPlugin);
      streamContentPlugin.api.streamContent.start();
      console.log('streaming', value);
      streamContentPlugin.api.streamContent.streamFull(value);
    } else {
      editor?.getPlugin(StreamContentPlugin)?.api.streamContent.stop();
    }
  }, [value, isStreaming]);

  const editor = usePlateEditor({
    plugins,
    value: [],
    readOnly: disabled || isStreaming
  });

  return editor;
};

export type ReportEditor = TPlateEditor<Value, (typeof EditorKit)[number]>;

export const useEditor = () => useEditorRef<ReportEditor>();
