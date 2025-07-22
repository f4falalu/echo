import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect } from 'react';
import { SyntaxHighlighter } from './SyntaxHighlighter';

const meta: Meta<typeof SyntaxHighlighter> = {
  title: 'UI/typography/SyntaxHighlighter',
  component: SyntaxHighlighter,
  parameters: {
    layout: 'padded'
  },
  argTypes: {
    children: {
      control: 'text',
      description: 'The code content to highlight'
    },
    language: {
      control: 'select',
      options: ['yaml', 'sql'],
      description: 'Programming language for syntax highlighting'
    },
    showLineNumbers: {
      control: 'boolean',
      description: 'Whether to show line numbers'
    },
    startingLineNumber: {
      control: 'number',
      description: 'Starting line number (if line numbers are shown)'
    },
    isDarkMode: {
      control: 'boolean',
      description: 'Whether to use dark theme'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes'
    },
    animation: {
      control: 'select',
      options: ['none', 'fadeIn', 'blurIn'],
      description: 'Animation style for lines'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

const sqlCode = `SELECT 
  users.id,
  users.email,
  profiles.first_name,
  profiles.last_name,
  COUNT(orders.id) as order_count
FROM users
LEFT JOIN profiles ON users.id = profiles.user_id
LEFT JOIN orders ON users.id = orders.user_id
WHERE users.created_at >= '2024-01-01'
  AND users.status = 'active'
GROUP BY users.id, users.email, profiles.first_name, profiles.last_name
HAVING COUNT(orders.id) > 0
ORDER BY order_count DESC, users.created_at ASC
LIMIT 100;`;

const yamlCode = `# Application Configuration
app:
  name: "Buster Analytics"
  version: "1.0.0"
  environment: production
  
database:
  host: localhost
  port: 5432
  name: buster_db
  ssl: true
  pool:
    min: 5
    max: 20
    timeout: 30000

features:
  - analytics
  - reporting
  - dashboards
  
logging:
  level: info
  format: json
  outputs:
    - console
    - file: /var/log/app.log`;

export const SqlExample: Story = {
  args: {
    children: sqlCode,
    language: 'sql',
    isDarkMode: false,
    showLineNumbers: false,
    className: 'border rounded-lg p-4 mr-2 max-w-[350px]'
  }
};

export const YamlExample: Story = {
  args: {
    children: yamlCode,
    language: 'yaml',
    isDarkMode: false,
    showLineNumbers: false,
    className: 'border rounded-lg p-4'
  }
};

export const SqlWithLineNumbers: Story = {
  args: {
    children: sqlCode,
    language: 'sql',
    isDarkMode: false,
    showLineNumbers: true,
    startingLineNumber: 1,
    className: 'border rounded-lg'
  }
};

export const DarkMode: Story = {
  args: {
    children: sqlCode,
    language: 'sql',
    isDarkMode: true,
    showLineNumbers: false,
    className: 'border rounded-lg p-4 bg-gray-900'
  }
};

export const DarkModeWithLineNumbers: Story = {
  args: {
    children: yamlCode,
    language: 'yaml',
    isDarkMode: true,
    showLineNumbers: true,
    startingLineNumber: 10,
    className: 'border rounded-lg bg-gray-900'
  }
};

export const CustomStyling: Story = {
  args: {
    children: sqlCode,
    language: 'sql',
    isDarkMode: false,
    showLineNumbers: true,
    className: 'shadow-lg',
    customStyle: {
      backgroundColor: '#f8f8f8',
      borderRadius: '12px',
      padding: '20px'
    }
  }
};

export const AnimatedFadeIn: Story = {
  args: {
    children: sqlCode,
    language: 'sql',
    isDarkMode: false,
    showLineNumbers: false,
    animation: 'fadeIn',
    className: 'border rounded-lg p-4'
  }
};

export const AnimatedBlurIn: Story = {
  args: {
    children: yamlCode,
    language: 'yaml',
    isDarkMode: true,
    showLineNumbers: true,
    animation: 'blurIn',
    className: 'border rounded-lg bg-gray-900'
  }
};

// Streaming animation stories
const StreamingAnimationStory = ({
  code,
  language = 'sql' as 'sql' | 'yaml',
  animation = 'fadeIn' as any,
  isDarkMode = false,
  showLineNumbers = false,
  delay = 500
}: {
  code: string;
  language?: 'sql' | 'yaml';
  animation?: any;
  isDarkMode?: boolean;
  showLineNumbers?: boolean;
  delay?: number;
}) => {
  const lines = code.split('\n');
  const [currentCode, setCurrentCode] = useState('');
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    if (lineIndex < lines.length) {
      const timer = setTimeout(() => {
        setCurrentCode((prev) => {
          const newLine = lines[lineIndex];
          return prev ? `${prev}\n${newLine}` : newLine;
        });
        setLineIndex(lineIndex + 1);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [lineIndex, lines, delay]);

  return (
    <div>
      <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
        Streaming: Line {lineIndex} of {lines.length}
      </div>
      <SyntaxHighlighter
        language={language}
        animation={animation}
        isDarkMode={isDarkMode}
        showLineNumbers={showLineNumbers}
        className="rounded-lg border p-4">
        {currentCode}
      </SyntaxHighlighter>
    </div>
  );
};

export const StreamingFadeIn: Story = {
  render: () => (
    <StreamingAnimationStory code={sqlCode} language="sql" animation="fadeIn" delay={300} />
  )
};

export const StreamingBlurIn: Story = {
  render: () => (
    <StreamingAnimationStory
      code={yamlCode}
      language="yaml"
      animation="blurIn"
      isDarkMode={true}
      delay={100}
    />
  )
};

export const StreamingWithLineNumbers: Story = {
  render: () => (
    <StreamingAnimationStory
      code={sqlCode}
      language="sql"
      animation="fadeIn"
      showLineNumbers={true}
      delay={200}
    />
  )
};

// Fast streaming to test performance
export const FastStreaming: Story = {
  render: () => (
    <StreamingAnimationStory code={sqlCode} language="sql" animation="blurIn" delay={50} />
  )
};
