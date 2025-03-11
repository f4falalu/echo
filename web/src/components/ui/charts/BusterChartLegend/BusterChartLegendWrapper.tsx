import React from 'react';
import { BusterChartLegend, BusterChartLegendItem } from '.';
import { ShowLegendHeadline } from '@/api/asset_interfaces/metric/charts';
import {
  ChartLegendWrapperProvider,
  useChartWrapperContextSelector
} from '../chartHooks/useChartWrapperProvider';
import { cn } from '@/lib/classMerge';

export type BusterChartLegendWrapper = {
  children: React.ReactNode;
  renderLegend: boolean;
  legendItems: BusterChartLegendItem[];
  showLegend: boolean;
  showLegendHeadline: ShowLegendHeadline | undefined;
  inactiveDatasets: Record<string, boolean>;
  className: string | undefined;
  animateLegend: boolean;
  onHoverItem: (item: BusterChartLegendItem, isHover: boolean) => void;
  onLegendItemClick: (item: BusterChartLegendItem) => void;
  onLegendItemFocus: ((item: BusterChartLegendItem) => void) | undefined;
}; //TODO scope down to only the props that are needed for this component

export const BusterChartLegendWrapper: React.FC<BusterChartLegendWrapper> = React.memo(
  ({
    children,
    renderLegend,
    legendItems,
    showLegend,
    showLegendHeadline,
    inactiveDatasets,
    animateLegend,
    className,
    onHoverItem,
    onLegendItemClick,
    onLegendItemFocus
  }) => {
    const width = useChartWrapperContextSelector(({ width }) => width);

    return (
      <ChartLegendWrapperProvider inactiveDatasets={inactiveDatasets}>
        <div className={cn(className, 'flex h-full w-full flex-col overflow-hidden')}>
          {renderLegend && (
            <BusterChartLegend
              show={showLegend}
              animateLegend={animateLegend}
              legendItems={legendItems}
              containerWidth={width}
              onClickItem={onLegendItemClick}
              onFocusItem={onLegendItemFocus}
              onHoverItem={onHoverItem}
              showLegendHeadline={showLegendHeadline}
            />
          )}

          <div className="h-full w-full overflow-hidden">{children}</div>
        </div>
      </ChartLegendWrapperProvider>
    );
  }
);
BusterChartLegendWrapper.displayName = 'BusterChartLegendWrapper';
