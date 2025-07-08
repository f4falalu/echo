import type { Meta, StoryObj } from '@storybook/react';
import { faker } from '@faker-js/faker';
import { DataContainer } from './DataContainer';
import type { DataResult } from '@buster/server-shared/metrics';

// Generate mock data that would be compatible with AppDataGrid
const generateMockData = (): DataResult => {
  const columns = ['id', 'name', 'email', 'department', 'salary', 'join_date'];
  const rows = Array.from({ length: 50 }, (_, index) => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: index % 3 === 2 ? null : faker.internet.email(),
    department: faker.commerce.department(),
    salary: faker.number.int({ min: 40000, max: 150000 }),
    join_date: faker.date.past({ years: 5 }).toISOString().split('T')[0]
  }));

  return rows as DataResult;
};

const meta = {
  title: 'Features/Layouts/DataContainer',
  component: DataContainer,
  parameters: {
    layout: 'fullscreen'
  },
  decorators: [
    (Story) => (
      <div style={{ height: '600px', padding: '20px' }}>
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof DataContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithData: Story = {
  args: {
    data: generateMockData(),
    fetchingData: false
  }
};

export const Loading: Story = {
  args: {
    data: null,
    fetchingData: true
  }
};

export const LoadingWithData: Story = {
  args: {
    data: generateMockData(),
    fetchingData: true
  }
};

export const NoData: Story = {
  args: {
    data: null,
    fetchingData: false
  }
};
