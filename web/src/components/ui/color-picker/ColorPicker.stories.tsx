import type { Meta, StoryObj } from '@storybook/react';
import { ColorPicker } from './ColorPicker';

const meta: Meta<typeof ColorPicker> = {
  title: 'UI/ColorPicker/ColorPicker',
  component: ColorPicker,
  tags: ['autodocs'],
  args: {
    value: '#000000',
    size: 'default',
    variant: 'default'
  },
  argTypes: {
    value: {
      control: 'color',
      description: 'The color value in hex format'
    },
    onChange: {
      description: 'Callback function when color changes'
    },
    onChangeComplete: {
      description: 'Callback function when color selection is complete'
    },
    size: {
      control: 'select',
      options: ['small', 'default', 'tall'],
      description: 'The size of the color picker button'
    },
    variant: {
      control: 'select',
      options: ['default', 'outline', 'secondary', 'ghost', 'link'],
      description: 'The variant style of the color picker button'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply'
    }
  }
};

export default meta;
type Story = StoryObj<typeof ColorPicker>;

export const Default: Story = {
  args: {
    value: '#FF0000'
  }
};

export const Small: Story = {
  args: {
    value: '#00FF00',
    size: 'small'
  }
};

export const Tall: Story = {
  args: {
    value: '#0000FF',
    size: 'tall'
  }
};

export const OutlineVariant: Story = {
  args: {
    value: '#800080',
    variant: 'outline'
  }
};

export const SecondaryVariant: Story = {
  args: {
    value: '#FFA500',
    variant: 'secondary'
  }
};

export const GhostVariant: Story = {
  args: {
    value: '#008080',
    variant: 'ghost'
  }
};

export const LinkVariant: Story = {
  args: {
    value: '#4B0082',
    variant: 'link'
  }
};
