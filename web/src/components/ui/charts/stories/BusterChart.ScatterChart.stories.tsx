import type { Meta, StoryObj } from '@storybook/react';
import { BusterChart } from '../BusterChart';
import { ChartType } from '../../../../api/asset_interfaces/metric/charts/enum';
import { IColumnLabelFormat } from '../../../../api/asset_interfaces/metric/charts/columnLabelInterfaces';
import { generateScatterChartData } from '../../../../mocks/chart/chartMocks';
import { sharedMeta } from './BusterChartShared';
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { useDebounceFn } from '@/hooks';

type ScatterChartData = ReturnType<typeof generateScatterChartData>;

const meta: Meta<typeof BusterChart> = {
  ...sharedMeta,
  title: 'UI/Charts/BusterChart/Scatter'
} as Meta<typeof BusterChart>;

export default meta;
type Story = StoryObj<typeof BusterChart>;

export const Default: Story = {
  args: {
    selectedChartType: ChartType.Scatter,
    data: generateScatterChartData(50),
    scatterAxis: {
      x: ['x'],
      y: ['y'],
      size: [],
      category: ['category']
    },
    barAndLineAxis: {
      x: ['x'],
      y: ['y'],
      category: []
    },
    columnLabelFormats: {
      x: {
        columnType: 'number',
        style: 'number',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      } satisfies IColumnLabelFormat,
      y: {
        columnType: 'number',
        style: 'number',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      } satisfies IColumnLabelFormat,
      size: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      category: {
        columnType: 'text',
        style: 'string'
      } satisfies IColumnLabelFormat
    } satisfies Record<keyof ScatterChartData, IColumnLabelFormat>,
    className: 'w-[400px] h-[400px]'
  }
};

export const WithoutCategory: Story = {
  args: {
    ...Default.args,
    scatterAxis: {
      x: ['x'],
      y: ['y'],
      size: [],
      category: []
    }
  }
};

export const LargeDataset: Story = {
  args: {
    ...Default.args,
    data: generateScatterChartData(3000)
  },
  render: (args) => {
    const [isPending, startTransition] = React.useTransition();
    const [points, setPoints] = React.useState(200);
    const [data, setData] = React.useState(generateScatterChartData(points));

    const { run: onSetData } = useDebounceFn(
      (value: number) => {
        startTransition(() => {
          setData(generateScatterChartData(value));
        });
      },
      { wait: 700 }
    );

    const onChangeValue = (value: number) => {
      setPoints(value);
      onSetData(value);
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-sm">Number of points:</span>
          <div className="w-64">
            <Slider
              min={0}
              max={5000}
              step={50}
              defaultValue={[points]}
              onValueChange={(value) => onChangeValue(value[0])}
            />
          </div>
          <span className="w-16 text-sm">{points}</span>
        </div>
        <div className="h-[400px] w-[400px]">
          <BusterChart {...args} data={data} />
        </div>
      </div>
    );
  }
};
