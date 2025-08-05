import { type Value } from 'platejs';
import {
  useEditorRef,
  usePlateEditor,
  type TPlateEditor,
  type WithPlateOptions
} from 'platejs/react';
import { useMemo } from 'react';

import { EditorKit } from './editor-kit';
import { FIXED_TOOLBAR_KIT_KEY } from './plugins/fixed-toolbar-kit';
import type { IReportEditor } from './ReportEditor';

export const useReportEditor = ({
  value,
  disabled,
  onReady,
  useFixedToolbarKit = false
}: {
  value: Value;
  disabled: boolean;
  onReady?: (editor: IReportEditor) => void;
  useFixedToolbarKit?: boolean;
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

  return usePlateEditor({
    plugins,
    value,
    readOnly: disabled,
    onReady: ({ editor }) => onReady?.(editor)
  }); // Pass dependencies to usePlateEditor
};

export type ReportEditor = TPlateEditor<Value, (typeof EditorKit)[number]>;

export const useEditor = () => useEditorRef<ReportEditor>();
