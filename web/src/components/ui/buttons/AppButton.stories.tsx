import type { Meta, StoryObj } from '@storybook/react';
import { AppButton } from './AppButton';
import * as OutlinedIcons from '../icons/NucleoIconOutlined';

const IconSelect = Object.keys(OutlinedIcons).map((icon) => {
  return icon;
});

const meta: Meta<typeof AppButton> = {
  title: 'Base/AppButton',
  component: AppButton,
  tags: ['autodocs'],
  args: {
    children: 'Button'
  },
  argTypes: {
    buttonType: {
      control: 'select',
      options: ['default', 'black', 'primary', 'ghost']
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
    selected: {
      control: 'boolean',
      defaultValue: false
    },
    prefix: {
      control: 'select',
      options: IconSelect
    },
    suffix: {
      control: 'select',
      options: IconSelect
    }
  },
  render: (args) => {
    const PrefixIcon = OutlinedIcons[args.prefix as keyof typeof OutlinedIcons];
    const SuffixIcon = OutlinedIcons[args.suffix as keyof typeof OutlinedIcons];
    const PrefixComponent = PrefixIcon ? <PrefixIcon /> : null;
    const SuffixComponent = SuffixIcon ? <SuffixIcon /> : null;
    return (
      <div className="flex gap-1 p-1">
        <AppButton {...args} prefix={PrefixComponent} suffix={SuffixComponent} />
      </div>
    );
  }
};

export default meta;
type Story = StoryObj<typeof AppButton>;

export const Default: Story = {
  args: {
    buttonType: 'default',
    size: 'default'
  }
};

export const Black: Story = {
  args: {
    buttonType: 'black',
    size: 'default'
  }
};

export const Primary: Story = {
  args: {
    buttonType: 'primary',
    size: 'default'
  }
};

export const Tall: Story = {
  args: {
    buttonType: 'default',
    size: 'tall'
  }
};

export const Disabled: Story = {
  args: {
    buttonType: 'default',
    size: 'default',
    disabled: true
  }
};

export const AsChild: Story = {
  args: {
    asChild: true,
    children: <a href="/">Link Button</a>
  }
};

export const Loading: Story = {
  args: {
    buttonType: 'default',
    size: 'default',
    loading: true
  }
};

export const WithBorder: Story = {
  args: {
    buttonType: 'default',
    size: 'default'
  }
};

export const Ghost: Story = {
  args: {
    buttonType: 'ghost',
    size: 'default'
  }
};

export const Small: Story = {
  args: {
    buttonType: 'default',
    size: 'small'
  }
};
