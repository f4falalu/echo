import React, { useMemo } from 'react';
import type { ChartConfigProps } from '@buster/server-shared/metrics';
import type { ColumnSettings } from '@buster/server-shared/metrics';
import { useMemoizedFn } from '@/hooks';
import { EditBarRoundness } from '../StylingAppVisualize/SelectAxis/SelectAxisColumnContent/EditBarRoundness';

export const EditBarRoundnessGlobal: React.FC<{
  columnSettings: ChartConfigProps['columnSettings'];
  onUpdateChartConfig: (chartConfig: Partial<ChartConfigProps>) => void;
}> = React.memo(({ columnSettings, onUpdateChartConfig }) => {
  const mostPermissiveBarRoundness = useMemo(() => {
    return Object.values(columnSettings).reduce((acc, curr) => {
      return Math.min(acc, curr.barRoundness);
    }, Number.POSITIVE_INFINITY);
  }, []);

  const onUpdateBarRoundness = useMemoizedFn((v: Partial<ColumnSettings>) => {
    const newColumnSettings: ChartConfigProps['columnSettings'] = Object.keys(
      columnSettings
    ).reduce<ChartConfigProps['columnSettings']>((acc, curr) => {
      acc[curr] = { ...columnSettings[curr], ...v };
      return acc;
    }, {});

    onUpdateChartConfig({ columnSettings: newColumnSettings });
  });

  return (
    <EditBarRoundness
      barRoundness={mostPermissiveBarRoundness}
      onUpdateColumnSettingConfig={onUpdateBarRoundness}
    />
  );
});
EditBarRoundnessGlobal.displayName = 'EditBarRoundnessGlobal';
