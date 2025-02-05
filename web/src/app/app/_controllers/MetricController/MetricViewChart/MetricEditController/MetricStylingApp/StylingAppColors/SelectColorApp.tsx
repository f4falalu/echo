import React, { useMemo } from 'react';
import { Segmented } from 'antd';
import { StylingAppColorsTab } from './config';
import { AppMaterialIconIcon, AppMaterialIcons } from '@/components/icons';

export const SelectColorApp: React.FC<{
  selectedTab: StylingAppColorsTab;
  onChange: (value: StylingAppColorsTab) => void;
}> = React.memo(({ selectedTab, onChange }) => {
  const options: { label: React.ReactNode; value: StylingAppColorsTab }[] = useMemo(
    () =>
      [
        { text: 'Colors', icon: 'palette', value: StylingAppColorsTab.Colors },
        { text: 'Palettes', icon: 'transition_chop', value: StylingAppColorsTab.Palettes },
        { text: 'Custom', icon: 'format_paint', value: StylingAppColorsTab.Custom }
      ].map(({ text, value, icon }) => ({
        label: (
          <div className="groupflex flex-col space-y-1.5 py-2.5">
            <div className="flex items-center justify-center">
              <AppMaterialIcons icon={icon as AppMaterialIconIcon} />
            </div>
            <span className="flex leading-none">{text}</span>
          </div>
        ),
        value
      })),
    [selectedTab]
  );

  return (
    <div className="flex w-full">
      <Segmented
        block
        className="w-full"
        options={options}
        defaultValue={selectedTab}
        onChange={onChange}
      />
    </div>
  );
});
SelectColorApp.displayName = 'SelectColorApp';
