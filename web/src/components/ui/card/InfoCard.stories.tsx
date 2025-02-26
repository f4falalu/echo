import type { Meta, StoryObj } from '@storybook/react';
import { InfoCard } from './InfoCard';
import { BellOutlined } from '@ant-design/icons';
import { faker } from '@faker-js/faker';

const meta: Meta<typeof InfoCard> = {
  title: 'Base/Cards/InfoCard',
  component: InfoCard,
  tags: ['autodocs'],
  args: {
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    icon: <BellOutlined />,
    onClick: () => {}
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'gray', 'ghost']
    },
    size: {
      control: 'select',
      options: ['default']
    },
    iconPosition: {
      control: 'select',
      options: ['top', 'center', 'bottom', 'absolute-top']
    },
    title: {
      control: 'text'
    },
    description: {
      control: 'text'
    },
    selected: {
      control: 'boolean'
    }
  }
};

export default meta;
type Story = StoryObj<typeof InfoCard>;

export const Default: Story = {
  args: {
    title: 'Notifications',
    description: 'You have 3 unread messages',
    icon: <BellOutlined className="text-primary text-xl" />,
    iconPosition: 'center'
  }
};

export const TopIcon: Story = {
  args: {
    title: 'System Status',
    description: 'All systems are operational',
    icon: <BellOutlined className="text-success text-xl" />,
    iconPosition: 'top'
  }
};

export const BottomIcon: Story = {
  args: {
    title: 'Updates Available',
    description: 'New version 2.0 is ready to install',
    icon: <BellOutlined className="text-warning text-xl" />,
    iconPosition: 'bottom'
  }
};

export const AbsoluteTopIcon: Story = {
  args: {
    title: 'Important Notice',
    description: 'Please review your account settings',
    icon: <BellOutlined className="text-danger text-xl" />,
    iconPosition: 'absolute-top'
  }
};

export const NoIcon: Story = {
  args: {
    title: 'Simple Card',
    description: 'A card without an icon',
    icon: null
  }
};
