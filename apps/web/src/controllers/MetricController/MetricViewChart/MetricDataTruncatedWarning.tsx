import React, { useState } from 'react';
import { Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/buttons';
import { Download4 } from '@/components/ui/icons';
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

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      
      // Call the API to get the download URL
      const response = await downloadMetricFile(metricId);
      
      // Simply navigate to the download URL
      // The response-content-disposition header will force a download
      window.location.href = response.downloadUrl;
      
    } catch (error) {
      console.error('Failed to download metric file:', error);
      // You might want to show an error toast here
    } finally {
      // Add a small delay before removing loading state since download happens async
      setTimeout(() => {
        setIsDownloading(false);
      }, 1000);
    }
  };

  return (
    <div
      className={cn('bg-background flex items-center justify-between rounded border p-4 shadow', className)}>
      <div className="flex flex-col space-y-1">
        <Text className="font-medium">This request returned more than 5,000 records</Text>
        <Text size="xs" variant="secondary">
          To see all records, you&apos;ll need to download the results.
        </Text>
      </div>
      <Button
        onClick={handleDownload}
        loading={isDownloading}
        variant="default"
        className="ml-4"
        prefix={<Download4 />}
      >
        Download
      </Button>
    </div>
  );
};