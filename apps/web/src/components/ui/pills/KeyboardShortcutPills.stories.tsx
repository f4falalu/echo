import type { Meta, StoryObj } from '@storybook/react-vite';
import { KeyboardShortcutPill } from './KeyboardShortcutPills';

const meta: Meta<typeof KeyboardShortcutPill> = {
  title: 'UI/Pills/KeyboardShortcutPill',
  component: KeyboardShortcutPill,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof KeyboardShortcutPill>;

export const SingleKey: Story = {
  args: {
    shortcut: ['⌘'],
  },
};

export const Combination: Story = {
  args: {
    shortcut: ['⌘', 'K'],
  },
};

export const Empty: Story = {
  args: {
    shortcut: [],
  },
};
