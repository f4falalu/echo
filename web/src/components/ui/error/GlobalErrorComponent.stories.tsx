import type { Meta, StoryObj } from '@storybook/react';
import { GlobalErrorComponent } from './GlobalErrorComponent';

const meta: Meta<typeof GlobalErrorComponent> = {
  title: 'Base/GlobalErrorComponent',
  component: GlobalErrorComponent,
  parameters: {
    layout: 'fullscreen'
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof GlobalErrorComponent>;

// Normal state with content
export const Default: Story = {
  args: {
    children: <div>Normal application content</div>
  }
};

// Error state
export const WithError: Story = {
  args: {
    children: <div>This content won't be visible due to error</div>
  },
  parameters: {
    error: new Error('Simulated error for story')
  },
  render: (args) => {
    const ErrorTrigger = () => {
      throw new Error('Simulated error for story');
    };

    return (
      <GlobalErrorComponent {...args}>
        <ErrorTrigger />
      </GlobalErrorComponent>
    );
  }
};
