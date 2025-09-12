import { useEditorRef } from 'platejs/react';
import type { BusterReportEditor } from './types';

export const useEditor = () => useEditorRef<BusterReportEditor>();
