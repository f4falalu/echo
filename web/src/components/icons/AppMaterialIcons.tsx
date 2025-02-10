import { PencilSquareIcon } from './customIcons/Pencil_Square';
import React from 'react';
import { MaterialSymbol, MaterialSymbolProps } from 'react-material-symbols';
import { BarChartSortDescIcon } from './customIcons/BarChartSortDescIcon';
import { BarChartSortNoneIcon } from './customIcons/BarChart_NoSort';
import { BarChartSortAscIcon } from './customIcons/BarChartSortAscIcon';
import { LineChartAreaChartIcon } from './customIcons/LineChart_AreaChart';
import { LineChartDotLineIcon } from './customIcons/LineChart_DotLine';
import { KeepIcon } from './customIcons/KeepIcon';
import { EditChartIcon } from './customIcons/EditChart';
import { StarsIcon } from './customIcons/Stars';
import { CircleWithRing } from './customIcons/CircleWithRing';

//https://react-material-symbols.vercel.app/?path=/docs/outlined--docs

const CustomIcons: Record<
  | 'edit_square'
  | 'bar_sort_asc'
  | 'bar_sort_desc'
  | 'bar_sort_none'
  | 'line_chart_area'
  | 'line_chart_dot_line'
  | 'keep'
  | 'stars'
  | 'chart_edit'
  | 'circle_with_ring',
  React.FC<MaterialSymbolProps & { 'data-value'?: string }>
> = {
  edit_square: PencilSquareIcon,
  bar_sort_asc: BarChartSortAscIcon,
  bar_sort_desc: BarChartSortDescIcon,
  bar_sort_none: BarChartSortNoneIcon,
  line_chart_area: LineChartAreaChartIcon,
  line_chart_dot_line: LineChartDotLineIcon,
  keep: KeepIcon,
  chart_edit: EditChartIcon,
  stars: StarsIcon,
  circle_with_ring: CircleWithRing
};

export type AppMaterialIconIcon = MaterialSymbolProps['icon'] | keyof typeof CustomIcons;

type AppMaterialIconProps = Omit<MaterialSymbolProps, 'icon'> & {
  icon: AppMaterialIconIcon;
};

export const AppMaterialIcons: React.FC<AppMaterialIconProps> = React.memo(
  ({ size = 16, weight = 400, ...props }) => {
    if (props.icon in CustomIcons) {
      const IconComponent = CustomIcons[props.icon as keyof typeof CustomIcons];
      return <IconComponent size={size} {...(props as any)} />;
    }

    return (
      <MaterialSymbol size={size} {...props} icon={props.icon as MaterialSymbolProps['icon']} />
    );
  }
);

AppMaterialIcons.displayName = 'AppMaterialIcons';
