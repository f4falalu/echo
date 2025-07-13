import React from 'react';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/classMerge';

interface MetricDataTruncatedWarningProps {
  className?: string;
}

export const MetricDataTruncatedWarning: React.FC<MetricDataTruncatedWarningProps> = ({ 
  className 
}) => {
  return (
    <div className={cn(
      'bg-background flex flex-col space-y-2 rounded border p-4 shadow',
      className
    )}>
      <Text size="sm" className="font-medium">
        This request returned more than 5,000 records
      </Text>
      <Text size="sm" variant="secondary">
        If you need more than that, please contact your data admin.
      </Text>
    </div>
  );
};