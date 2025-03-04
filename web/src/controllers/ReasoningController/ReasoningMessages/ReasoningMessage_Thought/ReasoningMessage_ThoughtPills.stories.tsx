import type { Meta, StoryObj } from '@storybook/react';
import { PillContainer } from './ReasoningMessage_ThoughtPills';

const meta: Meta<typeof PillContainer> = {
  title: 'Controllers/ReasoningController/ReasoningMessage_ThoughtPills',
  component: PillContainer,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof PillContainer>;

export const Default: Story = {
  args: {
    pills: [
      {
        id: '1',
        text: 'Metric: Revenue',
        type: 'metric'
      },
      {
        id: '2',
        text: 'Dashboard: Overview',
        type: 'dashboard'
      },
      {
        id: '3',
        text: 'Dataset: Users',
        type: 'dataset'
      }
    ],
    isCompletedStream: true
  }
};

export const WithAnimation: Story = {
  args: {
    ...Default.args,
    isCompletedStream: false
  }
};

export const SinglePill: Story = {
  args: {
    pills: [
      {
        id: '1',
        text: 'Single Pill Example',
        type: null
      }
    ],
    isCompletedStream: true
  }
};

export const EmptyPills: Story = {
  args: {
    pills: [],
    isCompletedStream: true
  }
};

export const ManyPills: Story = {
  args: {
    pills: Array.from({ length: 10 }, (_, i) => ({
      id: `${i + 1}`,
      text: `Pill ${i + 1}`,
      type: i % 2 === 0 ? 'metric' : null
    })),
    isCompletedStream: true
  }
};
