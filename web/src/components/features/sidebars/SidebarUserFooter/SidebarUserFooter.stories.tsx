import type { Meta, StoryObj } from '@storybook/react';
import { SidebarUserFooterComponent } from './SidebarUserFooter';

const meta: Meta<typeof SidebarUserFooterComponent> = {
  title: 'Features/Sidebars/SidebarUserFooter',
  component: SidebarUserFooterComponent,
  parameters: {
    layout: 'centered'
  },
  decorators: [
    (Story) => (
      <div className="bg-background-secondary h-screen w-[300px] p-4">
        <Story />
      </div>
    )
  ],
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof SidebarUserFooterComponent>;

export const Default: Story = {
  args: {
    name: 'John Doe',
    email: 'john.doe@example.com'
  }
};

export const WithoutAvatar: Story = {
  args: {
    name: 'Jane Smith',
    email: 'jane.smith@example.com'
  }
};

export const LongName: Story = {
  args: {
    name: 'Alexander Bartholomew Christopherson III',
    email: 'alexander@example.com'
  }
};
