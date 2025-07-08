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

export const Default: Story = {
  args: {
    trigger: <Button variant="outlined">Open Sheet</Button>,
    children: (
      <div className="py-4">
        <p>This is the sheet content. You can put any content here.</p>
      </div>
    )
  }
};

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

export const WithCustomHeader: Story = {
  args: {
    trigger: <Button variant="outlined">Open with Custom Header</Button>,
    header: (
      <div className="flex items-center gap-2 border-b p-4">
        <div className="h-8 w-8 rounded-full bg-blue-500"></div>
        <div>
          <h3 className="font-semibold">Custom Header</h3>
          <p className="text-sm text-gray-500">With custom content</p>
        </div>
      </div>
    ),
    children: (
      <div className="py-4">
        <p>Sheet content with a custom header component.</p>
      </div>
    )
  }
};

export const WithFooter: Story = {
  args: {
    trigger: <Button variant="outlined">Open with Footer</Button>,
    header: {
      title: 'Sheet with Footer'
    },
    footer: (
      <div className="flex justify-end gap-2 border-t p-4">
        <Button variant="outlined">Cancel</Button>
        <Button>Save Changes</Button>
      </div>
    ),
    children: (
      <div className="py-4">
        <p>This sheet has both header and footer sections.</p>
        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium">Example Form</label>
          <input
            type="text"
            placeholder="Enter some text..."
            className="w-full rounded border p-2"
          />
        </div>
      </div>
    )
  }
};

export const WithCloseButton: Story = {
  args: {
    trigger: <Button variant="outlined">Open with Close Button</Button>,
    showClose: true,
    closeButtonClassName: 'absolute top-4 right-4',
    header: {
      title: 'Sheet with Close Button'
    },
    children: (
      <div className="py-4">
        <p>This sheet has a close button in the top-right corner.</p>
      </div>
    )
  }
};

export const LeftSide: Story = {
  args: {
    trigger: <Button variant="outlined">Open from Left</Button>,
    side: 'left',
    header: {
      title: 'Left Side Sheet'
    },
    children: (
      <div className="py-4">
        <p>This sheet slides in from the left side.</p>
      </div>
    )
  }
};

export const TopSide: Story = {
  args: {
    trigger: <Button variant="outlined">Open from Top</Button>,
    side: 'top',
    header: {
      title: 'Top Side Sheet'
    },
    children: (
      <div className="py-4">
        <p>This sheet slides in from the top.</p>
      </div>
    )
  }
};

export const BottomSide: Story = {
  args: {
    trigger: <Button variant="outlined">Open from Bottom</Button>,
    side: 'bottom',
    header: {
      title: 'Bottom Side Sheet'
    },
    children: (
      <div className="py-4">
        <p>This sheet slides in from the bottom.</p>
      </div>
    )
  }
};

export const FullExample: Story = {
  args: {
    trigger: <Button>Open Full Example</Button>,
    side: 'right',
    showClose: true,
    closeButtonClassName: 'absolute top-4 right-4',
    header: {
      title: 'Complete Sheet Example',
      description: 'This demonstrates all available features'
    },
    footer: (
      <div className="flex items-center justify-between border-t bg-gray-50 p-4">
        <span className="text-sm text-gray-500">Last saved: Just now</span>
        <div className="flex gap-2">
          <Button variant="outlined">Cancel</Button>
          <Button>Save & Close</Button>
        </div>
      </div>
    ),
    children: (
      <div className="space-y-4 py-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Name</label>
          <input type="text" placeholder="Enter your name" className="w-full rounded border p-2" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full rounded border p-2"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Message</label>
          <textarea
            placeholder="Enter your message"
            rows={4}
            className="w-full rounded border p-2"
          />
        </div>
      </div>
    )
  }
};
