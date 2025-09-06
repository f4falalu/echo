import type { ChartConfigProps, ColumnSettings } from '@buster/server-shared/metrics';
import React, { useMemo } from 'react';
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

  const onUpdateBarRoundness = (v: Partial<ColumnSettings>) => {
    const newColumnSettings: ChartConfigProps['columnSettings'] = Object.keys(
      columnSettings
    ).reduce<ChartConfigProps['columnSettings']>((acc, curr) => {
      acc[curr] = { ...columnSettings[curr], ...v };
      return acc;
    }, {});

    onUpdateChartConfig({ columnSettings: newColumnSettings });
  };

  return (
    <EditBarRoundness
      barRoundness={mostPermissiveBarRoundness}
      onUpdateColumnSettingConfig={onUpdateBarRoundness}
    />
  );
});
EditBarRoundnessGlobal.displayName = 'EditBarRoundnessGlobal';
