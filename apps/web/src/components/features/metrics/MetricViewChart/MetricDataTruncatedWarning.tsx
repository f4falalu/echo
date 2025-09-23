import type React from 'react';
import { useDownloadMetricFile } from '@/api/buster_rest/metrics/getMetricQueryRequests';
import { Button } from '@/components/ui/buttons';
import { CircleWarning, Download4 } from '@/components/ui/icons';
import { Text } from '@/components/ui/typography';
import { useGetReportParams } from '@/context/Reports/useGetReportParams';
import { cn } from '@/lib/classMerge';

interface MetricDataTruncatedWarningProps {
  className?: string;
  metricId: string;
  metricVersionNumber: number | undefined;
}

export const MetricDataTruncatedWarning: React.FC<MetricDataTruncatedWarningProps> = ({
  className,
  metricId,
  metricVersionNumber,
}) => {
  const {
    mutateAsync: handleDownload,
    isPending: isGettingFile,
    error: downloadError,
  } = useDownloadMetricFile();

  const hasError = !!downloadError;

  return (
    <div
      className={cn(
        'bg-background flex items-center justify-between rounded border p-4 shadow',
        hasError && 'border-red-500',
        className
      )}
    >
      <div className="flex flex-col space-y-1">
        <Text className="font-medium">
          {hasError ? 'Download failed' : 'This request returned more than 5,000 records'}
        </Text>
        <Text size="xs" variant={hasError ? 'danger' : 'secondary'}>
          {hasError
            ? 'The download took too long or encountered an error. Please try again.'
            : "To see all records, you'll need to download the results."}
        </Text>
      </div>
      <Button
        onClick={() => handleDownload({ id: metricId, metric_version_number: metricVersionNumber })}
        loading={isGettingFile}
        variant={hasError ? 'danger' : 'default'}
        className="ml-4"
        prefix={hasError ? <CircleWarning /> : <Download4 />}
      >
        {hasError ? 'Try Again' : 'Download'}
      </Button>
    </div>
  );
};
