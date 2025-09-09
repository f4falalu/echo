import type { GetReportResponse } from '@buster/server-shared/reports';
import { Store, useStore } from '@tanstack/react-store';

const originalReportStore = new Store(new Map<string, GetReportResponse>());

export const bulkAddOriginalReports = (reports: Record<string, GetReportResponse>) => {
  Object.entries(reports).forEach(([id, report]) => {
    originalReportStore.setState((prev) => new Map(prev).set(id, report));
  });
};

export const setOriginalReport = (report: GetReportResponse) => {
  originalReportStore.setState((prev) => new Map(prev).set(report.id, report));
};

export const getOriginalReport = (reportId: string) => {
  return originalReportStore.state.get(reportId);
};

export const removeOriginalReport = (reportId: string) => {
  originalReportStore.setState((prev) => {
    const newState = new Map(prev);
    newState.delete(reportId);
    return newState;
  });
};

export const useOriginalReportStore = () => {
  return useStore(originalReportStore);
};

const stableSelectOriginalReport = (reportId: string | undefined) => {
  if (!reportId) return undefined;
  return (state: Map<string, GetReportResponse>) => state.get(reportId);
};

export const useGetOriginalReport = (reportId: string | undefined) => {
  return useStore(originalReportStore, stableSelectOriginalReport(reportId));
};
