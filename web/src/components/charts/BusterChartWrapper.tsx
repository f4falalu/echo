import { createStyles } from 'antd-style';
import React, { useRef } from 'react';
import { ChartWrapperProvider } from './chartHooks';
import { useSize } from 'ahooks';

export const BusterChartWrapper = React.memo<{
  children: React.ReactNode;
  id: string | undefined;
  className: string | undefined;
  bordered: boolean;
  loading: boolean;
}>(({ children, id, className, bordered, loading }) => {
  const { styles, cx } = useStyles();
  const ref = useRef<HTMLDivElement>(null);
  const size = useSize(ref);
  const width = size?.width ?? 400;

  return (
    <ChartWrapperProvider width={width}>
      <div
        ref={ref}
        id={id}
        className={cx(
          className,
          'flex h-full w-full flex-col',
          'transition duration-300',
          loading ? '!bg-transparent' : undefined,
          'overflow-hidden'
        )}>
        {children}
      </div>
    </ChartWrapperProvider>
  );
});

BusterChartWrapper.displayName = 'BusterChartWrapper';

const useStyles = createStyles(({ token }) => {
  return {};
});
