import { type Value } from 'platejs';
import {
  useEditorRef,
  usePlateEditor,
  type TPlateEditor,
  type WithPlateOptions
} from 'platejs/react';

import { AllEditorPlugins } from './all-editor-plugins';

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
    plugins: AllEditorPlugins,
    value,
    readOnly: disabled,
    onReady
  });
};

export type ReportEditor = TPlateEditor<Value, (typeof AllEditorPlugins)[number]>;

export const useEditor = () => useEditorRef<ReportEditor>();
