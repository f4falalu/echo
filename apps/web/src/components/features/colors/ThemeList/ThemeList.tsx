import React from 'react';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/classMerge';
import type { IColorPalette } from './interfaces';
import { ThemeColorDots } from './ThemeColorDots';
import { Dots } from '../../../ui/icons';
import { Button } from '../../../ui/buttons';
import { Popover } from '../../../ui/popover';

export const ThemeList: React.FC<{
  themes: IColorPalette[];
  className?: string;
  onChangeColorTheme: (theme: IColorPalette) => void;
  themeThreeDotsMenu?: React.FC<{ theme: IColorPalette }>;
}> = ({ themes, className, themeThreeDotsMenu, onChangeColorTheme }) => {
  return (
    <div
      className={cn(
        'bg-item-select rounded-sm border p-1',
        'flex w-full flex-col space-y-0.5 overflow-y-auto',
        className
      )}>
      {themes.map((theme) => (
        <ColorOption
          key={theme.id}
          theme={theme}
          selected={theme.selected}
          onChangeColorTheme={onChangeColorTheme}
          threeDotMenu={themeThreeDotsMenu}
        />
      ))}
    </div>
  );
};

const ColorOption: React.FC<{
  theme: IColorPalette;
  selected: boolean | undefined;
  threeDotMenu?: React.FC<{ theme: IColorPalette }>;
  onChangeColorTheme: (theme: IColorPalette) => void;
}> = React.memo(({ theme, selected = false, threeDotMenu, onChangeColorTheme }) => {
  const { name, colors } = theme;

  const ThreeDotMenuComponent = threeDotMenu;
  const shouldShowMenu = ThreeDotMenuComponent && !theme.hideThreeDotMenu;

  return (
    <div
      onClick={() => {
        onChangeColorTheme(theme);
      }}
      data-testid={`color-theme-${name}`}
      data-selected={selected}
      className={cn(
        'flex w-full items-center justify-between space-x-2.5 overflow-hidden',
        'h-7 min-h-7 cursor-pointer rounded-sm px-3 py-2',
        selected ? 'bg-background border' : 'bg-item-active hover:bg-nav-item-hover'
      )}>
      <Text truncate variant={selected ? 'default' : 'secondary'}>
        {name}
      </Text>

      <div className="flex items-center gap-x-1">
        <ThemeColorDots selected={selected} colors={colors} />

        {shouldShowMenu && (
          <div onClick={(e) => e.stopPropagation()}>
            <Popover
              className="p-0"
              content={<ThreeDotMenuComponent theme={theme} />}
              trigger="click">
              <Button
                data-testid={`color-theme-three-dots-menu`}
                variant={'ghost'}
                size={'small'}
                prefix={<Dots />}
              />
            </Popover>
          </div>
        )}
      </div>
    </div>
  );
});
ColorOption.displayName = 'ColorOption';
