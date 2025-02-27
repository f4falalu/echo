import type { Meta, StoryObj } from '@storybook/react';
import { AppCodeEditor } from './AppCodeEditor';

const meta: Meta<typeof AppCodeEditor> = {
  title: 'Base/Inputs/AppCodeEditor',
  component: AppCodeEditor,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-w-[500px]">
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof AppCodeEditor>;

const sampleSQLCode = `SELECT users.name, orders.order_date
FROM users
JOIN orders ON users.id = orders.user_id
WHERE orders.status = 'completed'
ORDER BY orders.order_date DESC;`;

const sampleYAMLCode = `version: '3'
services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
    volumes:
      - ./src:/usr/share/nginx/html`;

export const Default: Story = {
  args: {
    value: sampleSQLCode,
    height: '300px',
    language: 'pgsql',
    variant: 'bordered'
  }
};

export const ReadOnly: Story = {
  args: {
    value: sampleSQLCode,
    height: '300px',
    language: 'pgsql',
    readOnly: true,
    variant: 'bordered',
    readOnlyMessage: 'This is a read-only view'
  }
};

export const YAMLEditor: Story = {
  args: {
    value: sampleYAMLCode,
    height: '300px',
    language: 'yaml',
    variant: 'bordered'
  }
};

export const CustomHeight: Story = {
  args: {
    value: sampleSQLCode,
    height: '500px',
    language: 'pgsql',
    variant: 'bordered'
  }
};

export const EmptyEditor: Story = {
  args: {
    height: '200px',
    language: 'pgsql',
    variant: 'bordered'
  }
};
