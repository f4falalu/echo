import { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import React, { useMemo } from 'react';
import { LabelAndInput } from '../Common';
import { Switch } from 'antd';
import { useMemoizedFn } from 'ahooks';
import { ENABLED_DOTS_ON_LINE } from '@/api/asset_interfaces';

export const EditDotsOnLineGlobal: React.FC<{
  columnSettings: IBusterMetricChartConfig['columnSettings'];
  onUpdateChartConfig: (config: Partial<IBusterMetricChartConfig>) => void;
}> = React.memo(({ columnSettings, onUpdateChartConfig }) => {
  const allDotsOnLine = useMemo(() => {
    return Object.values(columnSettings).some((column) => column.lineSymbolSize > 0);
  }, [columnSettings]);

  const onChangeAllSmooth = useMemoizedFn((value: boolean) => {
    onUpdateChartConfig({
      columnSettings: Object.keys(columnSettings).reduce<
        IBusterMetricChartConfig['columnSettings']
      >((acc, curr) => {
        acc[curr] = { ...columnSettings[curr], lineSymbolSize: value ? ENABLED_DOTS_ON_LINE : 0 };
        return acc;
      }, {})
    });
  });

  return (
    <LabelAndInput label="Dot on lines">
      <div className="flex w-full justify-end">
        <Switch defaultChecked={allDotsOnLine} onChange={onChangeAllSmooth} />
      </div>
    </LabelAndInput>
  );
});
EditDotsOnLineGlobal.displayName = 'EditDotsOnLineGlobal';
