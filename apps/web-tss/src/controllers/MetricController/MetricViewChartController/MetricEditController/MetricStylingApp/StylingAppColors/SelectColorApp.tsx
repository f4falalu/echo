import React from 'react';
import Cards from '@/components/ui/icons/NucleoIconOutlined/cards';
import Paintbrush from '@/components/ui/icons/NucleoIconOutlined/paintbrush';
import Palette from '@/components/ui/icons/NucleoIconOutlined/palette';
import { AppSegmented, type SegmentedItem } from '@/components/ui/segmented';
import { StylingAppColorsTab } from './config';

const options: SegmentedItem<StylingAppColorsTab>[] = [
  { label: 'Colors', icon: <Palette />, value: StylingAppColorsTab.Colors },
  { label: 'Palettes', icon: <Cards />, value: StylingAppColorsTab.Palettes },
  { label: 'Custom', icon: <Paintbrush />, value: StylingAppColorsTab.Custom },
];

export const SelectColorApp: React.FC<{
  selectedTab: StylingAppColorsTab;
  onChange: (value: StylingAppColorsTab) => void;
}> = React.memo(({ selectedTab, onChange }) => {
  const onChangePreflight = (value: SegmentedItem<StylingAppColorsTab>) => {
    onChange(value.value);
  };

  return (
    <AppSegmented
      size="large"
      block
      options={options}
      value={selectedTab}
      onChange={onChangePreflight}
    />
  );
});
SelectColorApp.displayName = 'SelectColorApp';
