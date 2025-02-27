import type { Meta, StoryObj } from '@storybook/react';
import { OverflowButton } from '../OverflowContainer';
import { ChartType } from '../../interfaces';

const meta = {
  title: 'Base/Charts/OverflowButton',
  component: OverflowButton,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof OverflowButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockLegendItems = [
  {
    id: '1',
    color: '#FF5733',
    inactive: false,
    type: ChartType.Line,
    formattedName: 'Series A',
    serieName: 'series-a'
  },
  {
    id: '2',
    color: '#33FF57',
    inactive: false,
    type: ChartType.Line,
    formattedName: 'Series B',
    serieName: 'series-b'
  },
  {
    id: '3',
    color: '#3357FF',
    inactive: true,
    type: ChartType.Line,
    formattedName: 'Inactive Series C',
    serieName: 'series-c'
  }
];

export const Default: Story = {
  args: {
    legendItems: mockLegendItems,
    onClickItem: (item) => console.log('Clicked:', item),
    onFocusClick: (item) => console.log('Focused:', item)
  }
};

export const WithInactiveItems: Story = {
  args: {
    legendItems: mockLegendItems.map((item) => ({ ...item, inactive: true }))
  }
};

export const WithManyItems: Story = {
  args: {
    legendItems: Array.from({ length: 10 }, (_, i) => ({
      id: `${i + 1}`,
      color: `hsl(${(i * 36) % 360}, 70%, 50%)`,
      inactive: false,
      type: ChartType.Line,
      formattedName: `Series ${String.fromCharCode(65 + i)}`,
      serieName: `series-${String.fromCharCode(97 + i)}`
    }))
  }
};
