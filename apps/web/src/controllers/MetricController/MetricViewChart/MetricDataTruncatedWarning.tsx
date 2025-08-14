import React, { useState } from 'react';
import { Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/buttons';
import { Download4, CircleWarning } from '@/components/ui/icons';
import { cn } from '@/lib/classMerge';
import { downloadMetricFile } from '@/api/buster_rest/metrics/requests';

interface MetricDataTruncatedWarningProps {
  className?: string;
  metricId: string;
}

export const MetricDataTruncatedWarning: React.FC<MetricDataTruncatedWarningProps> = ({
  className,
  metricId
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setHasError(false);

      // Create a timeout promise that rejects after 2 minutes (matching backend timeout)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Download timeout')), 2 * 60 * 1000); // 2 minutes
      });

      // Race between the API call and the timeout
      const response = (await Promise.race([
        downloadMetricFile(metricId),
        timeoutPromise
      ])) as Awaited<ReturnType<typeof downloadMetricFile>>;

      // Simply navigate to the download URL
      // The response-content-disposition header will force a download
      window.location.href = response.downloadUrl;

      // Keep button disabled for longer since download is async
      // User can click again after 5 seconds if needed
      setTimeout(() => {
        setIsDownloading(false);
      }, 5000);
    } catch (error) {
      console.error('Failed to download metric file:', error);
      setHasError(true);
      // Re-enable button immediately on error so user can retry
      setIsDownloading(false);
    }
  };

  return (
    <div
      className={cn(
        'bg-background flex items-center justify-between rounded border p-4 shadow',
        hasError && 'border-red-500',
        className
      )}>
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
        loading={isDownloading}
        variant={hasError ? 'danger' : 'default'}
        className="ml-4"
        prefix={hasError ? <CircleWarning /> : <Download4 />}>
        {hasError ? 'Try Again' : 'Download'}
      </Button>
    </div>
  );
};
