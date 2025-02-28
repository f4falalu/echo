import { Meta, StoryObj } from '@storybook/react';
import { IconSelectOutlined } from './NucleoIconOutlined/iconStories';
import { IconSelectFilled } from './NucleoIconFilled/iconStories';
import * as OutlinedIcons from './NucleoIconOutlined';
import * as FilledIcons from './NucleoIconFilled';

const TestComponent = ({
  icon,
  color,
  size
}: {
  icon: string;
  color: string;
  size: '12px' | '16px' | '18px';
}) => {
  const IconComponent = OutlinedIcons[icon as keyof typeof OutlinedIcons];
  console.log(size, color);

  return (
    <div className="flex items-center justify-center" style={{ fontSize: size, color: color }}>
      <IconComponent />
    </div>
  );
};

const meta: Meta<typeof TestComponent> = {
  title: 'UI/Icons/Nucleo',
  component: TestComponent,
  parameters: {
    layout: 'centered'
  },
  argTypes: {
    icon: {
      control: 'select',
      options: IconSelectOutlined
    },
    color: {
      control: 'color',
      defaultValue: '#000000'
    },
    size: {
      control: 'select',
      options: ['12px', '16px', '18px']
    }
  },
  args: {
    icon: 'add-above',
    color: '#000000',
    size: '16px'
  }
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Outlined: Story = {
  args: {
    icon: 'add-above',
    color: '#000000',
    size: '16px'
  }
};

export const Filled: Story = {
  args: {
    icon: 'add-above',
    color: '#000000',
    size: '16px'
  },
  argTypes: {
    icon: {
      options: IconSelectFilled
    }
  }
};
