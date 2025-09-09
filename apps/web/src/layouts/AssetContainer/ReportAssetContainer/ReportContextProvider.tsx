import { useCallback, useRef, useState, useTransition } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import type { BusterReportEditor } from '@/components/ui/report/types';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';

const useReportAssetContext = () => {
  const [forceUpdate, startForceUpdate] = useTransition();
  const [hasEditor, setHasEditor] = useState(false);
  const [versionHistoryMode, setVersionHistoryMode] = useState<number | false>(false);
  const editor = useRef<BusterReportEditor | null>(null);
  const undo = useRef<(() => void) | null>(null);
  const redo = useRef<(() => void) | null>(null);

  console.log('hasEditor', editor.current, !!undo.current, !!redo.current, hasEditor, forceUpdate);

  const openReportVersionHistoryMode = useMemoizedFn((versionNumber: number) => {
    setVersionHistoryMode(versionNumber);
  });

  const closeVersionHistoryMode = useMemoizedFn(() => {
    setVersionHistoryMode(false);
  });

  const setEditor = useMemoizedFn((editor: BusterReportEditor) => {
    if (!editor) {
      return;
    }

    editor.current = editor;
    undo.current = editor.undo;
    redo.current = editor.redo;

    startForceUpdate(() => {
      setHasEditor(true);
      console.log('setEditor2', editor.current);
      console.log('editor.current', editor.current);
    });
  });

  return {
    openReportVersionHistoryMode,
    closeVersionHistoryMode,
    versionHistoryMode,
    setEditor,
    hasEditor,
    editor,
  };
};

const ReportAssetContext = createContext<ReturnType<typeof useReportAssetContext>>(
  {} as ReturnType<typeof useReportAssetContext>
);

export const ReportAssetContextProvider = ({
  children,
}: {
  children:
    | React.ReactNode
    | ((context: ReturnType<typeof useReportAssetContext>) => React.ReactNode);
}) => {
  const context = useReportAssetContext();

  return (
    <ReportAssetContext.Provider value={context}>
      {typeof children === 'function' ? children(context) : children}
    </ReportAssetContext.Provider>
  );
};

const stableVersionHistorySelector = (x: ReturnType<typeof useReportAssetContext>) => ({
  versionHistoryMode: x.versionHistoryMode,
  openReportVersionHistoryMode: x.openReportVersionHistoryMode,
  closeVersionHistoryMode: x.closeVersionHistoryMode,
});

export const useReportVersionHistoryMode = () => {
  const { closeVersionHistoryMode, openReportVersionHistoryMode, versionHistoryMode } =
    useContextSelector(ReportAssetContext, stableVersionHistorySelector);
  return {
    versionHistoryMode,
    openReportVersionHistoryMode,
    closeVersionHistoryMode,
  };
};

const stableSetEditorSelector = (x: ReturnType<typeof useReportAssetContext>) => x.setEditor;
const stableHasEditorSelector = (x: ReturnType<typeof useReportAssetContext>) => x.hasEditor;
export const useEditorContext = () => {
  const hasEditor = useContextSelector(ReportAssetContext, stableHasEditorSelector);
  const setEditor = useContextSelector(ReportAssetContext, stableSetEditorSelector);
  const editor = useContextSelector(
    ReportAssetContext,
    useCallback((x) => x.editor, [hasEditor])
  );

  if (!setEditor) {
    console.warn(
      'ReportAssetContext is not defined. useEditorContext must be used within a ReportAssetContextProvider.'
    );
  }

  return {
    editor,
    setEditor,
  };
};
