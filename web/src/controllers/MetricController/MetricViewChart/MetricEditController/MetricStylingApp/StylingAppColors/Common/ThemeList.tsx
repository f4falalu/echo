import React from 'react';
import { IColorTheme } from './interfaces';
import { Text } from '@/components/ui/typography';
import { ThemeColorDots } from './ThemeColorDots';
import { cn } from '@/lib/classMerge';

export const ThemeList: React.FC<{
  themes: {
    selected: boolean;
    name: string;
    colors: string[];
  }[];
  onChangeColorTheme: (theme: IColorTheme) => void;
}> = ({ themes, onChangeColorTheme }) => {
  return (
    <div
      className={cn(
        'bg-item-active rounded-sm border px-1',
        'flex w-full flex-col space-y-0 overflow-y-auto'
      )}>
      {themes.map((theme) => (
        <ColorOption
          key={theme.name}
          theme={theme}
          selected={theme.selected}
          onChangeColorTheme={onChangeColorTheme}
        />
      ))}
    </div>
  );
};

const ColorOption: React.FC<{
  theme: IColorTheme;
  selected: boolean;
  onChangeColorTheme: (theme: IColorTheme) => void;
}> = React.memo(({ theme, selected, onChangeColorTheme }) => {
  const { name, colors } = theme;

  return (
    <div
      onClick={() => onChangeColorTheme(theme)}
      className={cn(
        'bg-item-active rounded-sm border p-1',
        'cursor-pointer px-1.5 py-3',
        'bg-item-hover hover:shadow-[inset_0_0_0_0.5px]',
        selected && 'bg-item-active hover:bg-item-active border shadow-[inset_0_0_0_0.5px]',
        'flex w-full items-center justify-between'
      )}>
      <div className="flex items-center space-x-2">
        <Text>{name}</Text>
      </div>

      <ThemeColorDots colors={colors} />
    </div>
  );
});
ColorOption.displayName = 'ColorOption';
