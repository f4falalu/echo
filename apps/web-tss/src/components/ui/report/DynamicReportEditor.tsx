import { lazy, Suspense } from 'react';
import type { ReportEditorProps } from './ReportEditor';
import { ReportEditorSkeleton } from './ReportEditorSkeleton';

const DynamicReportEditorBase = lazy(() =>
  import('@/components/ui/report/ReportEditor').then((mod) => {
    return {
      default: mod.ReportEditor,
    };
  })
);

export const DynamicReportEditor = (props: ReportEditorProps) => {
  return (
    <Suspense fallback={<ReportEditorSkeleton />}>
      <DynamicReportEditorBase {...props} />
    </Suspense>
  );
};

export default DynamicReportEditor;
