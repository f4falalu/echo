'use client';

import React from 'react';
import { SettingsCards } from './SettingsCard';
import { Text } from '@/components/ui/typography';
import { useMount } from '../../../hooks';
import { prefetchColorThemes } from '../../../api/buster_rest/dictionaries';
import { ThemeColorDots } from '../colors/ThemeList/ThemeColorDots';
import { Popover } from '../../ui/popover';
import { DefaultThemeSelector } from '../colors/DefaultThemeSelector';
import { ChevronDown } from '../../ui/icons';
import { useGetPalettes } from '@/context-hooks/useGetOrganizationPalettes';

export const DefaultColorThemeCard = React.memo(() => {
  return (
    <SettingsCards
      cards={[
        {
          sections: [
            <div key="default-color-theme" className="flex items-center justify-between space-x-4">
              <div className="flex flex-col space-y-0.5">
                <Text>Default color theme</Text>
                <Text variant="secondary" size={'xs'}>
                  Default color theme that Buster will use when creating charts
                </Text>
              </div>
              <PickButton />
            </div>
          ]
        }
      ]}
    />
  );
});

DefaultColorThemeCard.displayName = 'DefaultColorThemeCard';

const PickButton = React.memo(() => {
  const { defaultPalette } = useGetPalettes();

  const hasDefaultPalette = !!defaultPalette;

  useMount(() => {
    prefetchColorThemes();
  });

  return (
    <Popover
      className="p-0"
      align="end"
      content={
        <div className="max-w-[320px] overflow-y-auto p-2.5">
          <DefaultThemeSelector themeListClassName="max-h-[320px] h-full overflow-y-auto" />
        </div>
      }>
      <div className="hover:bg-item-hover flex h-7 min-h-7 cursor-pointer items-center space-x-1.5 overflow-hidden rounded border px-2 py-1 pl-2.5">
        <div>
          {hasDefaultPalette ? (
            <ThemeColorDots colors={defaultPalette.colors} numberOfColors={'all'} />
          ) : (
            <Text variant="secondary" size={'xs'}>
              No default color theme
            </Text>
          )}
        </div>

        <div className="text-icon-color flex items-center justify-center">
          <ChevronDown />
        </div>
      </div>
    </Popover>
  );
});

PickButton.displayName = 'PickButton';
