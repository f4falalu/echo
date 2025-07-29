import type { Meta, StoryObj } from '@storybook/react';
import { AppReport } from './AppReport';
import type { Value } from 'platejs';
import { ReportElement } from '@buster/server-shared/reports';

const meta = {
  title: 'UI/report/AppReport',
  component: AppReport,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  args: {
    placeholder: 'Start typing...',
    readOnly: false,
    disabled: false,
    variant: 'default'
  }
} satisfies Meta<typeof AppReport>;

export default meta;
type Story = StoryObj<typeof meta>;

// Create a strictly typed value first, then assert it as Value for platejs
const sampleValue = [
  {
    type: 'h1', // This will now error if you use 'h1xs'
    children: [{ text: 'Welcome to the Report Editor' }]
  },
  {
    type: 'p',
    children: [
      { text: 'This is a sample paragraph with ' },
      { text: 'bold text', bold: true },
      { text: ' and ' },
      { text: 'italic text', italic: true },
      { text: '.' },
      { text: 'hilight', highlight: true }
    ]
  },
  {
    type: 'h2',
    children: [{ text: 'Features' }]
  },
  {
    type: 'ul',
    children: [
      { type: 'li', children: [{ text: 'Rich text editing' }] },
      { type: 'li', children: [{ text: 'Multiple block types' }] },
      { type: 'li', children: [{ text: 'Customizable appearance' }] }
    ]
  },
  {
    type: 'callout',
    variant: 'info',
    children: [{ text: 'This is an info callout with custom styling!' }]
  },
  {
    type: 'h3', // This is now valid - TypeScript knows this is a valid HeadingType
    children: [{ text: 'Title' }]
  },
  // Uncommenting this would cause a TypeScript error:
  // {
  //   type: 'xxxh3', // Error: Type '"xxxh3"' is not assignable to type ReportElementType
  //   children: [{ text: 'Invalid' }]
  // },
  {
    type: 'blockquote',
    children: [
      { text: 'This is a blockquote. It can contain styled text and other inline elements.' }
    ]
  },
  {
    type: 'code_block',
    lang: 'javascript',
    children: [{ text: 'const greeting = "Hello, World!";\nconsole.log(greeting);' }]
  },
  {
    type: 'h1',
    children: [{ text: 'Hello' }]
  }
] satisfies ReportElement[];

// Cast to Value for platejs compatibility
const plateValue = sampleValue;

export const Default: Story = {
  args: {
    value: plateValue
  }
};

export const ReadOnly: Story = {
  args: {
    value: plateValue,
    readOnly: true
  }
};
