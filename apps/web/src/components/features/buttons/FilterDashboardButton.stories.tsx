import type { Meta, StoryObj } from '@storybook/nextjs';
import { FilterDashboardButton } from './FilterDashboardButton';

const meta = {
  title: 'Features/Buttons/FilterDashboardButton',
  component: FilterDashboardButton,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof FilterDashboardButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {}
};
