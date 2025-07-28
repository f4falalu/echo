import type { Meta, StoryObj } from '@storybook/react';
import type { Value } from 'platejs';
import { AppReport } from './AppReport';

const meta: Meta<typeof AppReport> = {
  title: 'UI/report/AppReport',
  component: AppReport,
  parameters: {
    layout: 'fullscreen'
  },
  decorators: [
    (Story) => (
      <div className="relative overflow-hidden p-18">
        <div className="h-full min-h-[250px] overflow-hidden rounded-lg border">
          <Story />
        </div>
      </div>
    )
  ],
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default']
    },
    readonly: {
      control: { type: 'boolean' }
    },
    placeholder: {
      control: { type: 'text' }
    },
    className: {
      control: { type: 'text' }
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Example value structure for Plate.js
const exampleValue: Value = [
  {
    id: '1',
    type: 'p',
    children: [
      {
        text: 'This is an example report with some content. You can edit this text if readonly is set to false.'
      }
    ]
  },
  {
    id: '2',
    type: 'p',
    children: [{ text: 'This component uses Plate.js for rich text editing capabilities.' }]
  }
];

export const Default: Story = {
  args: {
    value: exampleValue,
    placeholder: 'Start typing your report...',
    readonly: false,
    variant: 'default'
  }
};
