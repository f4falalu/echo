import type { Meta, StoryObj } from '@storybook/react';
import { InviteLinks } from './InviteLinks';

const meta: Meta<typeof InviteLinks> = {
  title: 'Features/InviteLinks',
  component: InviteLinks,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A security feature component that allows administrators to manage invite links for workspace access. Users can enable/disable invite links, generate new links, and copy them to clipboard.'
      }
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof InviteLinks>;

export const Default: Story = {
  name: 'Default',
  parameters: {
    docs: {
      description: {
        story:
          'The default state of the InviteLinks component showing the toggle switch, link input field, and action buttons.'
      }
    }
  }
};
