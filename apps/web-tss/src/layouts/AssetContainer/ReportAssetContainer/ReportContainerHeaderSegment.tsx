import { type ParsedLocation, useLocation } from '@tanstack/react-router';
import React, { useCallback, useMemo } from 'react';
import { AppSegmented } from '@/components/ui/segmented';
import { useIsReportReadOnly } from '@/context/Reports/useIsReportReadOnly';

interface ReportContainerHeaderSegmentProps {
  reportId: string;
  reportVersionNumber: number | undefined;
}

export const ReportContainerHeaderSegment: React.FC<ReportContainerHeaderSegmentProps> = React.memo(
  (props) => {
    const { reportId, reportVersionNumber } = props;

    const { isFetched, isError } = useIsReportReadOnly({
      reportId,
    });

    if (!isFetched || isError) return null;

    return <ReportSegments {...props} />;
  }
);

ReportContainerHeaderSegment.displayName = 'ReportContainerHeaderSegment';

type ReportView = 'content';

const ReportSegments: React.FC<ReportContainerHeaderSegmentProps> = React.memo(() => {
  const location = useLocation({
    select: useCallback((location: ParsedLocation) => {
      // Get the last value after a slash in the pathname
      const pathSegments = location.pathname.split('/').filter(Boolean);
      const lastSegment = pathSegments[pathSegments.length - 1] || '';
      return lastSegment;
    }, []),
  });

  const selectedView: ReportView = useMemo(() => {
    if (location === 'content') return 'content';
    return 'content';
  }, [location]);

  return (
    <AppSegmented
      type="button"
      options={[
        {
          label: 'Report',
          value: 'content' satisfies ReportView,
        },
      ]}
      value={selectedView}
    />
  );
});

ReportSegments.displayName = 'ReportSegments';
