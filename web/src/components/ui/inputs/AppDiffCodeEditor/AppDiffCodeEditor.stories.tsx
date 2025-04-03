import type { Meta, StoryObj } from '@storybook/react';
import { AppDiffCodeEditor } from './AppDiffCodeEditor';

const meta: Meta<typeof AppDiffCodeEditor> = {
  title: 'UI/Inputs/AppDiffCodeEditor',
  component: AppDiffCodeEditor,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    viewMode: {
      control: 'radio',
      options: ['side-by-side', 'inline'],
      defaultValue: 'side-by-side',
      description: 'Controls whether the diff is displayed side-by-side or inline'
    }
  },
  decorators: [
    (Story) => (
      <div className="min-h-[500px] min-w-[1000px]">
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof AppDiffCodeEditor>;

const originalYaml = `# Original YAML configuration
server:
  port: 8080
  host: localhost
database:
  url: jdbc:mysql://localhost:3306/mydb
  username: admin
  password: secret
logging:
  level: INFO
  path: /var/logs`;

const modifiedYaml = `# Updated YAML configuration
server:
  port: 9090
  host: localhost
  timeout: 30s
database:
  url: jdbc:mysql://localhost:3306/mydb
  username: admin
  password: secret
  pool:
    maxConnections: 20
    minIdle: 5
logging:
  level: DEBUG
  path: /var/logs/app`;

const originalSql = `-- Original SQL query
SELECT 
  customers.id,
  customers.name,
  orders.order_date
FROM customers
JOIN orders ON customers.id = orders.customer_id
WHERE orders.status = 'completed'
ORDER BY orders.order_date DESC;`;

const modifiedSql = `-- Updated SQL query
SELECT 
  customers.id,
  customers.name,
  customers.email,
  orders.order_date,
  orders.total_amount
FROM customers
JOIN orders ON customers.id = orders.customer_id
LEFT JOIN order_items ON orders.id = order_items.order_id
WHERE orders.status = 'completed'
  AND orders.total_amount > 100
GROUP BY customers.id
ORDER BY orders.order_date DESC
LIMIT 100;`;

export const Default: Story = {
  args: {
    original: originalYaml,
    modified: modifiedYaml,
    height: '300px',
    language: 'yaml',
    variant: 'bordered',
    viewMode: 'side-by-side'
  }
};

export const InlineView: Story = {
  args: {
    original: originalYaml,
    modified: modifiedYaml,
    height: '300px',
    language: 'yaml',
    variant: 'bordered',
    viewMode: 'inline'
  }
};

export const SQL: Story = {
  args: {
    original: originalSql,
    modified: modifiedSql,
    height: '300px',
    language: 'sql',
    variant: 'bordered',
    viewMode: 'side-by-side'
  }
};

export const SQLInline: Story = {
  args: {
    original: originalSql,
    modified: modifiedSql,
    height: '300px',
    language: 'sql',
    variant: 'bordered',
    viewMode: 'inline'
  }
};

export const ReadOnly: Story = {
  args: {
    original: originalYaml,
    modified: modifiedYaml,
    height: '300px',
    language: 'yaml',
    readOnly: true,
    variant: 'bordered',
    readOnlyMessage: 'This is a read-only view',
    viewMode: 'side-by-side'
  }
};

export const TallerView: Story = {
  args: {
    original: originalSql,
    modified: modifiedSql,
    height: '500px',
    language: 'sql',
    variant: 'bordered',
    viewMode: 'side-by-side'
  }
};

export const EmptyEditor: Story = {
  args: {
    height: '300px',
    language: 'yaml',
    variant: 'bordered',
    viewMode: 'side-by-side'
  }
};
