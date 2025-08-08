'use client';

import { type Value } from 'platejs';
import { useEditorRef, usePlateEditor, type TPlateEditor } from 'platejs/react';
import { useMemo } from 'react';
import { EditorKit } from './editor-kit';
import { FIXED_TOOLBAR_KIT_KEY } from './plugins/fixed-toolbar-kit';
import { CUSTOM_KEYS } from './config/keys';

export const useReportEditor = ({
  value,
  disabled,
  mode,
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

    if (filteredKeys.length > 0) {
      return EditorKit.filter((plugin) => !filteredKeys.includes(plugin.key));
    }

    return EditorKit;
  }, [useFixedToolbarKit]);

  console.log('mode in useReportEditor', mode);

  return usePlateEditor({
    plugins,
    value,
    options: {
      [CUSTOM_KEYS.globalVariable]: {
        mode
      },
      swag: {
        mode
      }
    },
    readOnly: disabled
  });
};

export type ReportEditor = TPlateEditor<Value, (typeof EditorKit)[number]>;

export const useEditor = () => useEditorRef<ReportEditor>();
