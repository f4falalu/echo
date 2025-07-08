import type { Meta, StoryObj } from '@storybook/react';
import { Sheet } from './Sheets';
import { Button } from '../buttons/Button';

const meta: Meta<typeof Sheet> = {
  title: 'UI/sheet/Sheet',
  component: Sheet,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    side: {
      control: { type: 'select' },
      options: ['top', 'right', 'bottom', 'left']
    },
    closeStyle: {
      control: { type: 'select' },
      options: ['collapse', 'close', 'none']
    },
    trigger: {
      control: false
    },
    children: {
      control: false
    },
    header: {
      control: false
    },
    footer: {
      control: false
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithHeader: Story = {
  args: {
    trigger: <Button variant="outlined">Open with Header</Button>,
    header: (
      <div className="flex items-center gap-2">
        <Button variant="outlined">Button 1</Button>
        <Button variant="ghost">Button 2</Button>
        <Button variant="primary">Button 3</Button>
      </div>
    ),
    children: (
      <div className="py-4">
        <p>Sheet content with a structured header above.</p>
      </div>
    )
  }
};
