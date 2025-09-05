import { useState } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';

const useReportAssetContext = () => {
  const [versionHistoryMode, setVersionHistoryMode] = useState<number | false>(false);

  const openReportVersionHistoryMode = useMemoizedFn((versionNumber: number) => {
    setVersionHistoryMode(versionNumber);
  });

  const closeVersionHistoryMode = useMemoizedFn(() => {
    setVersionHistoryMode(false);
  });

  return {
    openReportVersionHistoryMode,
    closeVersionHistoryMode,
    versionHistoryMode,
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
