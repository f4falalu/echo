import type { Meta, StoryObj } from '@storybook/react';
import { ButtonDropdown } from './ButtonDropdown';
import { PaintRoller } from '../icons/NucleoIconOutlined';

const meta: Meta<typeof ButtonDropdown> = {
  title: 'Base/ButtonDropdown',
  component: ButtonDropdown,
  parameters: {
    layout: 'centered'
  },
  argTypes: {
    buttonType: {
      control: 'select',
      options: ['default', 'black', 'primary', 'ghost', 'link']
    },
    size: {
      control: 'select',
      options: ['default', 'tall', 'small']
    },
    disabled: {
      control: 'boolean',
      defaultValue: false
    },
    loading: {
      control: 'boolean',
      defaultValue: false
    },
    rounding: {
      control: 'select',
      options: ['default', 'full', 'large', 'small', 'none']
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof ButtonDropdown>;

export const Default: Story = {
  args: {
    buttonText: 'Button Text',
    buttonType: 'default'
  }
};

export const Primary: Story = {
  args: {
    buttonText: 'Primary Button',
    buttonType: 'primary'
  }
};

export const Black: Story = {
  args: {
    buttonText: 'Black Button',
    buttonType: 'black'
  }
};

export const Ghost: Story = {
  args: {
    buttonText: 'Ghost Button',
    buttonType: 'ghost'
  }
};

export const Link: Story = {
  args: {
    buttonText: 'Link Button',
    buttonType: 'link'
  }
};

export const Tall: Story = {
  args: {
    buttonText: 'Tall Button',
    size: 'tall'
  }
};

export const Small: Story = {
  args: {
    buttonText: 'Small Button',
    size: 'small'
  }
};

export const Disabled: Story = {
  args: {
    buttonText: 'Disabled Button',
    disabled: true
  }
};

export const WithIcon: Story = {
  args: {
    buttonText: 'With Icon',
    icon: <PaintRoller />
  }
};
