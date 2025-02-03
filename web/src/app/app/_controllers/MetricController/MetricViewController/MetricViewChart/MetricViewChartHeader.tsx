import React from 'react';
import { createStyles } from 'antd-style';
import { Text, EditableTitle } from '@/components/text';

export const MetricViewChartHeader: React.FC<{
  className?: string;
  title: string | undefined;
  description: string | undefined | null;
  timeFrame: string | undefined;
  onSetTitle: (value: string) => void;
}> = React.memo(({ className, title = '', description, timeFrame, onSetTitle }) => {
  const { styles, cx } = useStyles();

  return (
    <div className={cx('flex flex-col space-y-0 py-2', className)}>
      <EditableTitle level={4} className="mb-0" inputClassName="!text-md" onChange={onSetTitle}>
        {title}
      </EditableTitle>
      <div className="flex items-center space-x-1">
        <Text type="secondary" className="!text-sm">
          {description}
        </Text>
        {!!timeFrame && (
          <Text type="secondary" className="!text-sm">
            •
          </Text>
        )}
        {!!timeFrame && (
          <Text type="secondary" className="!text-sm">
            {timeFrame}
          </Text>
        )}
      </div>
    </div>
  );
});

MetricViewChartHeader.displayName = 'MetricViewChartHeader';

const useStyles = createStyles(({ css, token }) => ({}));
