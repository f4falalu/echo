import type React from 'react';
import { useState } from 'react';
import { useDownloadMetricFile } from '@/api/buster_rest/metrics/getMetricQueryRequests';
import { Button } from '@/components/ui/buttons';
import { CircleWarning, Download4 } from '@/components/ui/icons';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/classMerge';

interface MetricDataTruncatedWarningProps {
  className?: string;
  metricId: string;
}

export const MetricDataTruncatedWarning: React.FC<MetricDataTruncatedWarningProps> = ({
  className,
  metricId,
}) => {
  const { mutateAsync: downloadMetricFile, isPending: isGettingFile } = useDownloadMetricFile();
  const [hasError, setHasError] = useState(false);

  const handleDownload = async () => {
    try {
      setHasError(false);

      // Create a timeout promise that rejects after 2 minutes (matching backend timeout)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Download timeout')), 2 * 60 * 1000); // 2 minutes
      });

      // Race between the API call and the timeout
      const response = (await Promise.race([
        downloadMetricFile(metricId),
        timeoutPromise,
      ])) as Awaited<ReturnType<typeof downloadMetricFile>>;

      // Create a temporary anchor element to trigger download without navigation
      const link = document.createElement('a');
      link.href = response.downloadUrl;
      link.download = ''; // This will use the filename from the response-content-disposition header
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download metric file:', error);
      setHasError(true);
    }
  };

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
        onClick={handleDownload}
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
