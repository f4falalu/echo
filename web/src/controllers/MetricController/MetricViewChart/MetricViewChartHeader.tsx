import React from 'react';
import { createStyles } from 'antd-style';
import { Text, EditableTitle } from '@/components/ui';
import { ConfigProvider, Skeleton } from 'antd';

export const MetricViewChartHeader: React.FC<{
  className?: string;
  title: string | undefined;
  description: string | undefined | null;
  timeFrame: string | undefined;
  onSetTitle: (value: string) => void;
}> = React.memo(({ className, title = '', description, timeFrame, onSetTitle }) => {
  const { styles, cx } = useStyles();

  const hasTitleOrDescription = !!title || !!description;

  return (
    <div className={cx('flex flex-col space-y-0 py-2', styles.header, className)}>
      {hasTitleOrDescription ? (
        <>
          <EditableTitle level={4} className="mb-0" inputClassName="text-md!" onChange={onSetTitle}>
            {title}
          </EditableTitle>
          <div className="flex items-center space-x-1">
            {!!timeFrame && (
              <>
                <Text type="secondary" className="text-sm!">
                  {timeFrame}
                </Text>
                <Text type="secondary" className="text-sm!">
                  •
                </Text>
              </>
            )}

            <Text type="secondary" className="truncate text-sm!">
              {description}
            </Text>
          </div>
        </>
      ) : (
        <SkeletonText />
      )}
    </div>
  );
});

MetricViewChartHeader.displayName = 'MetricViewChartHeader';

const SkeletonText: React.FC = () => {
  return (
    <div className="flex w-full flex-col space-y-1 overflow-hidden">
      <ConfigProvider
        theme={{
          components: {
            Skeleton: {
              titleHeight: 15
            }
          }
        }}>
        <Skeleton
          title={{
            width: '45%'
          }}
          active
          paragraph={false}
        />
      </ConfigProvider>
      <ConfigProvider
        theme={{
          components: {
            Skeleton: {
              titleHeight: 12
            }
          }
        }}>
        <Skeleton
          active
          title={{
            width: '75%'
          }}
          paragraph={false}
        />
      </ConfigProvider>
      {/* <Skeleton.Input
        active
        className="h-4! w-1/2! overflow-hidden rounded-md"
        rootClassName="w-full!"
      />
      <Skeleton.Input
        active
        className="h-2! w-3/4! overflow-hidden rounded-md"
        rootClassName="w-full!"
      /> */}
    </div>
  );
};

const useStyles = createStyles(({ css, token }) => ({
  header: css`
    min-height: 52px;
  `
}));
