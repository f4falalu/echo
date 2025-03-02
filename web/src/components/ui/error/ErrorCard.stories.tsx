import type { Meta, StoryObj } from '@storybook/react';
import { ErrorCard } from './ErrorCard';

const meta: Meta<typeof ErrorCard> = {
  title: 'UI/Error/ErrorCard',
  component: ErrorCard,
  tags: ['autodocs'],
  argTypes: {
    error: {
      control: 'text',
      description: 'The error message to display'
    },
    title: {
      control: 'text',
      description: 'Optional title for the error alert'
    },
    variant: {
      control: { type: 'select' },
      options: ['danger', 'default'],
      description: 'The visual style of the error alert'
    }
  }
};

export default meta;
type Story = StoryObj<typeof ErrorCard>;

export const Default: Story = {
  args: {
    error: 'Something went wrong. Please try again later.',
    title: 'Error',
    variant: 'default'
  }
};

export const Danger: Story = {
  args: {
    error: 'Failed to save changes. Please check your connection and try again.',
    title: 'Connection Error',
    variant: 'danger'
  }
};

export const WithoutTitle: Story = {
  args: {
    error: 'This is an error message without a title.',
    variant: 'default'
  }
};

export const LongErrorMessage: Story = {
  args: {
    error:
      'This is a very long error message that might wrap to multiple lines. It contains detailed information about what went wrong and possibly some suggestions on how to fix the issue.',
    title: 'Detailed Error',
    variant: 'danger'
  }
};
