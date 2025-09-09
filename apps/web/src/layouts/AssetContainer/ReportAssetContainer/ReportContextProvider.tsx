import { useCallback, useRef, useState, useTransition } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import type { BusterReportEditor } from '@/components/ui/report/types';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';

const useReportAssetContext = () => {
  const [forceUpdate, startForceUpdate] = useTransition();
  const [versionHistoryMode, setVersionHistoryMode] = useState<number | false>(false);
  const editor = useRef<BusterReportEditor | null>(null);

  const openReportVersionHistoryMode = useMemoizedFn((versionNumber: number) => {
    setVersionHistoryMode(versionNumber);
  });

  const closeVersionHistoryMode = useMemoizedFn(() => {
    setVersionHistoryMode(false);
  });

  const setEditor = useMemoizedFn((editorInstance: BusterReportEditor) => {
    if (!editorInstance) {
      return;
    }

    startForceUpdate(() => {
      editor.current = editorInstance;
    });
  });

  return {
    openReportVersionHistoryMode,
    closeVersionHistoryMode,
    versionHistoryMode,
    setEditor,
    forceUpdate,
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
const stableForceUpdateSelector = (x: ReturnType<typeof useReportAssetContext>) => x.forceUpdate;
export const useEditorContext = () => {
  const forceUpdate = useContextSelector(ReportAssetContext, stableForceUpdateSelector);
  const setEditor = useContextSelector(ReportAssetContext, stableSetEditorSelector);
  const editor = useContextSelector(
    ReportAssetContext,
    useCallback((x) => x.editor, [forceUpdate])
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
