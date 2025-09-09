import type { Value } from 'platejs';
import type { TPlateEditor } from 'platejs/react';
import type { EditorKit } from './editor-kit';

export type BusterReportEditor = TPlateEditor<Value, ReturnType<typeof EditorKit>[number]>;
