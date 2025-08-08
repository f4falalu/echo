import type { IReportEditor } from '@/components/ui/report/ReportEditor';

// Simple in-memory registry to map reportId -> editor instance
const reportEditorRegistry = new Map<string, IReportEditor>();

export const registerReportEditor = (reportId: string, editor: IReportEditor) => {
  reportEditorRegistry.set(reportId, editor);
};

export const unregisterReportEditor = (reportId: string) => {
  reportEditorRegistry.delete(reportId);
};

export const getReportEditor = (reportId: string): IReportEditor | undefined => {
  return reportEditorRegistry.get(reportId);
};
