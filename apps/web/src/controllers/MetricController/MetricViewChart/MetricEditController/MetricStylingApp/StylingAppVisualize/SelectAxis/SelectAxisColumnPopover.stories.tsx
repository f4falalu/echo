import type { Meta, StoryObj } from '@storybook/react';
import { HttpResponse, http } from 'msw';
import type { ChartConfigProps } from '@buster/server-shared/metrics';
import { Button } from '@/components/ui/buttons/Button';
import { SelectAxisContainerId } from './config';
import {
  SelectAxisColumnPopover,
  type SelectAxisColumnPopoverProps
} from './SelectAxisColumnPopover';
import type { ColumnLabelFormat } from '@buster/server-shared/metrics';

const meta: Meta<typeof SelectAxisColumnPopover> = {
  title: 'Controllers/EditMetricController/SelectAxisColumnPopover',
  component: SelectAxisColumnPopover,
  parameters: {
    layout: 'centered',
    msw: {
      handlers: [
        http.get(`api/currency`, () => {
          return HttpResponse.json([
            { code: 'USD', description: 'United States Dollar', flag: '🇺🇸' },
            { code: 'EUR', description: 'Euro', flag: '🇪🇺' },
            { code: 'GBP', description: 'British Pound', flag: '🇬🇧' },
            { code: 'CNY', description: 'Chinese Yuan', flag: '🇨🇳' },
            { code: 'JPY', description: 'Japanese Yen', flag: '🇯🇵' }
          ]);
        })
      ]
    }
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '2rem' }}>
        <Story />
      </div>
    )
  ]
};

export default meta;

type Story = StoryObj<typeof SelectAxisColumnPopover>;

const mockProps: SelectAxisColumnPopoverProps = {
  columnLabelFormat: {
    columnType: 'text',
    style: 'currency' as const,
    displayName: 'Test Column',
    numberSeparatorStyle: ',' as const,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    currency: 'USD',
    convertNumberTo: null,
    dateFormat: 'auto',
    useRelativeTime: false,
    isUTC: false,
    multiplier: 1,
    prefix: '',
    suffix: '',
    replaceMissingDataWith: null,
    makeLabelHumanReadable: true,
    compactNumbers: false
  } satisfies ColumnLabelFormat,
  columnSetting: {
    showDataLabels: false,
    showDataLabelsAsPercentage: false,
    columnVisualization: 'bar' as const,
    lineWidth: 2,
    lineStyle: 'line' as const,
    lineType: 'normal' as const,
    lineSymbolSize: 0,
    barRoundness: 8
  } satisfies ChartConfigProps['columnSettings'][string],
  id: 'test-id',
  selectedChartType: 'bar',
  barGroupType: 'group',
  lineGroupType: 'stack',
  zoneId: SelectAxisContainerId.XAxis,
  selectedAxis: {
    x: ['test-id'],
    y: [],
    category: [],
    size: [],
    tooltip: [],
    y2: []
  },
  rowCount: 10,
  children: <Button>Open Axis Selector</Button>
};

export const Default: Story = {
  args: {
    ...mockProps,
    children: <Button>Open Axis Selector</Button>
  }
};

export const WithDifferentAxis: Story = {
  args: {
    ...mockProps,
    zoneId: SelectAxisContainerId.YAxis,
    selectedAxis: {
      x: [],
      y: ['test-id'],
      category: [],
      size: [],
      tooltip: [],
      y2: []
    },
    children: <Button>Select Y Axis</Button>
  }
};

export const WithLargeDataset: Story = {
  args: {
    ...mockProps,
    rowCount: 1000,
    children: <Button>Large Dataset Selector</Button>
  }
};
