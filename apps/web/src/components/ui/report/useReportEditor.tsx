'use client';

import { type Value } from 'platejs';
import { useEditorRef, usePlateEditor, type TPlateEditor } from 'platejs/react';
import { useMemo } from 'react';
import { EditorKit } from './editor-kit';
import { FIXED_TOOLBAR_KIT_KEY } from './plugins/fixed-toolbar-kit';
import { GlobalVariablePlugin } from './plugins/global-variable-kit';

export const useReportEditor = ({
  value,
  disabled,
  mode = 'default',
  useFixedToolbarKit = false
}: {
  value: Value;
  disabled: boolean;
  useFixedToolbarKit?: boolean;
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

  return usePlateEditor({
    plugins,
    value,
    readOnly: disabled
  });
};

export type ReportEditor = TPlateEditor<Value, (typeof EditorKit)[number]>;

export const useEditor = () => useEditorRef<ReportEditor>();
