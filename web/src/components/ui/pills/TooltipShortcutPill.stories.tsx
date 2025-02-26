import type { Meta, StoryObj } from '@storybook/react';
import { KeyboardShortcutPill } from './TooltipShortcutPill';

const meta: Meta<typeof KeyboardShortcutPill> = {
  title: 'Base/KeyboardShortcutPill',
  component: KeyboardShortcutPill,
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof KeyboardShortcutPill>;

export const SingleKey: Story = {
  args: {
    shortcut: ['⌘']
  }
};

export const Combination: Story = {
  args: {
    shortcut: ['⌘', 'K']
  }
};

export const Empty: Story = {
  args: {
    shortcut: []
  }
};
