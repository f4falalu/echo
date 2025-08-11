import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout';
import { useMemo } from 'react';
import { create } from 'zustand';

type ReportQueryStore = {
  latestReportVersions: Record<string, number>;
  onSetLatestReportVersion: (reportId: string, versionNumber: number) => void;
};

export const useReportQueryStore = create<ReportQueryStore>((set) => ({
  latestReportVersions: {},
  onSetLatestReportVersion: (reportId: string, versionNumber: number) =>
    set((state) => ({
      latestReportVersions: {
        ...state.latestReportVersions,
        [reportId]: versionNumber
      }
    }))
}));

export const useGetReportVersionNumber = (props?: {
  reportId: string | undefined;
  versionNumber?: number | null;
}): {
  selectedVersionNumber: number | null;
  paramVersionNumber?: number;
  latestVersionNumber: number | null;
} => {
  const { reportId, versionNumber } = props || {};

  const versionNumberQueryParam = useChatLayoutContextSelector((x) => x.reportVersionNumber);
  const reportIdPathParam = useChatLayoutContextSelector((x) => x.reportId);
  const latestVersionNumber = useReportQueryStore(
    (x) => x.latestReportVersions[reportId || reportIdPathParam || '']
  );

  const paramVersionNumber = useMemo(() => {
    return versionNumberQueryParam ? versionNumberQueryParam : undefined;
  }, [versionNumberQueryParam]);

  const effectiveVersionNumber = useMemo(() => {
    if (versionNumber === null) return null;
    return versionNumber || paramVersionNumber || latestVersionNumber || null;
  }, [versionNumber, paramVersionNumber, latestVersionNumber]);

  return useMemo(() => {
    return {
      selectedVersionNumber: effectiveVersionNumber,
      paramVersionNumber,
      latestVersionNumber
    };
  }, [effectiveVersionNumber, paramVersionNumber, latestVersionNumber, reportId]);
};

export const useGetLatestReportVersionMemoized = () => {
  const latestVersionNumber = useReportQueryStore((x) => x.latestReportVersions);
  return useMemoizedFn((reportId: string) => latestVersionNumber[reportId]);
};
