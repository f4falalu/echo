import type { Meta, StoryObj } from '@storybook/react';
import { NewTermModal } from '.';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false
    }
  }
});

// Create a wrapper component that provides necessary context
const ModalWithProviders = (props: React.ComponentProps<typeof NewTermModal>) => {
  return (
    <QueryClientProvider client={queryClient}>
      <NewTermModal {...props} />
    </QueryClientProvider>
  );
};

const meta = {
  title: 'Features/NewTermModal',
  component: ModalWithProviders,
  parameters: {
    layout: 'centered'
  },
  decorators: [
    (Story) => {
      // Mock the terms context and dataset query
      queryClient.setQueryData(
        ['datasets'],
        [
          { id: '1', name: 'Customer Data' },
          { id: '2', name: 'Sales Data' },
          { id: '3', name: 'Product Analytics' }
        ]
      );

      return <Story />;
    }
  ],
  tags: ['autodocs']
} satisfies Meta<typeof ModalWithProviders>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: true,
    onClose: () => {}
  }
};

export const Closed: Story = {
  args: {
    open: false,
    onClose: () => {}
  }
};

export const WithMockedData: Story = {
  args: {
    open: true,
    onClose: () => {}
  },
  decorators: [
    (Story) => {
      queryClient.setQueryData(
        ['datasets'],
        [
          { id: '1', name: 'Customer Data' },
          { id: '2', name: 'Sales Data' },
          { id: '3', name: 'Product Analytics' }
        ]
      );
      return <Story />;
    }
  ]
};

export const Loading: Story = {
  args: {
    open: true,
    onClose: () => {}
  },
  decorators: [
    (Story) => {
      // Clear any existing data to show loading state
      queryClient.removeQueries({ queryKey: ['datasets'] });
      return <Story />;
    }
  ]
};
