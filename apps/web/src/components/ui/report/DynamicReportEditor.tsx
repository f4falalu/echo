import dynamic from 'next/dynamic';
import { ReportEditorSkeleton } from './ReportEditorSkeleton';
import { ReportEditor } from './ReportEditor';

export const DynamicReportEditor = dynamic(
  () => import('@/components/ui/report/ReportEditor').then((mod) => mod.ReportEditor),
  {
    ssr: false,
    loading: () => <ReportEditorSkeleton />
  }
);

export default DynamicReportEditor;
