import type { Meta, StoryObj } from '@storybook/react';
import { InputCard } from './InputCard';

const meta = {
  title: 'UI/card/InputCard',
  component: InputCard,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the input field'
    },
    buttonText: {
      control: 'text',
      description: 'Text displayed on the submit button'
    },
    value: {
      control: 'text',
      description: 'Initial value for the input field'
    },
    loading: {
      control: 'boolean',
      description: 'Loading state for the button'
    },
    onChange: {
      action: 'changed',
      description: 'Callback fired when input value changes'
    },
    onSubmit: {
      action: 'submitted',
      description: 'Callback fired when submit button is clicked'
    }
  }
} satisfies Meta<typeof InputCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter your message here...',
    buttonText: 'Submit',
    value: '',
    loading: false
  }
};
