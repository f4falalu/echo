import { useState } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';

const useDashboardAssetContext = () => {
  const [versionHistoryMode, setVersionHistoryMode] = useState<number | false>(false);

  const openVersionHistoryMode = useMemoizedFn((versionNumber: number) => {
    setVersionHistoryMode(versionNumber);
  });

  const closeVersionHistoryMode = useMemoizedFn(() => {
    setVersionHistoryMode(false);
  });

  return {
    openVersionHistoryMode,
    closeVersionHistoryMode,
    versionHistoryMode,
  };
};

const DashboardAssetContext = createContext<ReturnType<typeof useDashboardAssetContext>>(
  {} as ReturnType<typeof useDashboardAssetContext>
);

export const DashboardAssetContextProvider = ({
  children,
}: {
  children:
    | React.ReactNode
    | ((context: ReturnType<typeof useDashboardAssetContext>) => React.ReactNode);
}) => {
  const context = useDashboardAssetContext();

  return (
    <DashboardAssetContext.Provider value={context}>
      {typeof children === 'function' ? children(context) : children}
    </DashboardAssetContext.Provider>
  );
};

const stableVersionHistorySelector = (x: ReturnType<typeof useDashboardAssetContext>) => ({
  versionHistoryMode: x.versionHistoryMode,
  openVersionHistoryMode: x.openVersionHistoryMode,
  closeVersionHistoryMode: x.closeVersionHistoryMode,
});

export const useVersionHistoryMode = () => {
  const { closeVersionHistoryMode, openVersionHistoryMode, versionHistoryMode } =
    useContextSelector(DashboardAssetContext, stableVersionHistorySelector);
  return { versionHistoryMode, openVersionHistoryMode, closeVersionHistoryMode };
};
