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
    readOnly: {
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

const initialValue: Value = [
  {
    children: [{ text: 'Title' }],
    type: 'h3'
  },
  {
    children: [{ text: 'This is a quote.' }],
    type: 'blockquote'
  },
  {
    children: [
      { text: 'With some ' },
      { bold: true, text: 'bold' },
      { text: ' text for emphasis!' }
    ],
    type: 'p'
  }
];

export const Default: Story = {
  args: {
    value: initialValue,
    placeholder: 'Start typing your report...',
    readonly: false,
    variant: 'default'
  }
};
