import type { Meta, StoryObj } from '@storybook/react';
import { AppVerticalCodeSplitter } from './AppVerticalCodeSplitter';

const meta: Meta<typeof AppVerticalCodeSplitter> = {
  title: 'UI/Layouts/AppVerticalCodeSplitter',
  component: AppVerticalCodeSplitter,
  parameters: {
    layout: 'fullscreen'
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof AppVerticalCodeSplitter>;

const mockData: Record<string, string | number | null>[] = [
  { id: 1, name: 'Sample Data 1' },
  { id: 2, name: 'Sample Data 2' }
];

export const Default: Story = {
  args: {
    sql: 'SELECT * FROM sample_table',
    setSQL: (sql: string) => console.log('SQL changed:', sql),
    runSQLError: null,
    onRunQuery: async () => console.log('Running query...'),
    data: mockData,
    fetchingData: false,
    defaultLayout: ['50%', '50%'],
    autoSaveId: 'default-splitter'
  }
};

export const WithError: Story = {
  args: {
    ...Default.args,
    runSQLError: 'Invalid SQL syntax'
  }
};

export const Loading: Story = {
  args: {
    ...Default.args,
    fetchingData: true
  }
};

export const TopHidden: Story = {
  args: {
    ...Default.args,
    topHidden: true
  }
};

export const CustomGap: Story = {
  args: {
    ...Default.args,
    gapAmount: 6
  }
};

export const WithSaveButton: Story = {
  args: {
    ...Default.args,
    onSaveSQL: async () => console.log('Saving SQL...')
  }
};

export const DisabledSave: Story = {
  args: {
    ...Default.args,
    onSaveSQL: async () => console.log('Saving SQL...'),
    disabledSave: true
  }
};
