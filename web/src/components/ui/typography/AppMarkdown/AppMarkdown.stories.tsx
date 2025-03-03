import type { Meta, StoryObj } from '@storybook/react';
import { AppMarkdown } from './AppMarkdown';
import React from 'react';

const meta: Meta<typeof AppMarkdown> = {
  title: 'UI/Typography/AppMarkdown',
  component: AppMarkdown,
  argTypes: {
    markdown: {
      control: 'text',
      description: 'The markdown content to render'
    },
    showLoader: {
      control: 'boolean',
      description: 'Whether to show a loader'
    },
    className: {
      control: 'text',
      description: 'Additional CSS class names'
    }
  }
};

export default meta;
type Story = StoryObj<typeof AppMarkdown>;

export const Basic: Story = {
  args: {
    markdown: '# Hello World\n\nThis is a basic markdown example.'
  }
};

export const WithHeadings: Story = {
  args: {
    markdown: `# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

Regular paragraph text.`
  }
};

export const WithFormatting: Story = {
  args: {
    markdown: `# Text Formatting

**Bold text** and *italic text* and ~~strikethrough~~.

Combined **bold and _italic_** formatting.

\`Inline code\` with backticks.`
  }
};

export const WithLists: Story = {
  args: {
    markdown: `# Lists

## Unordered List
- Item 1
- Item 2
  - Nested item 2.1
  - Nested item 2.2
- Item 3

## Ordered List
1. First item
2. Second item
   1. Nested item 2.1
   2. Nested item 2.2
3. Third item`
  }
};

export const WithCodeBlocks: Story = {
  args: {
    markdown: `# Code Blocks

\`\`\`javascript
function helloWorld() {
  console.log('Hello, world!');
}
\`\`\`

\`\`\`css
.container {
  display: flex;
  justify-content: center;
}
\`\`\`

\`\`\`jsx
import React from 'react';

const Component = () => {
  return <div>Hello World</div>;
};
\`\`\``
  }
};

export const WithBlockquotes: Story = {
  args: {
    markdown: `# Blockquotes

> This is a blockquote
> 
> It can span multiple lines

> Nested blockquotes
> > Like this one`
  }
};

export const WithTables: Story = {
  args: {
    markdown: `# Tables

| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
| Cell 7   | Cell 8   | Cell 9   |`
  }
};

export const WithLinks: Story = {
  args: {
    markdown: `# Links

[Link to Google](https://www.google.com)

[Link with title](https://www.example.com "Example Website")

Automatic link: <https://www.example.com>`
  }
};

export const ComplexExample: Story = {
  args: {
    markdown: `# Markdown Documentation

## Introduction

This is a **comprehensive** example of markdown rendering capabilities.

## Features

### Text Formatting

You can make text **bold**, *italic*, or ~~strikethrough~~.

### Lists

Unordered list:
- Item 1
- Item 2
  - Nested item
- Item 3

Ordered list:
1. First step
2. Second step
   1. Sub-step
   2. Another sub-step
3. Final step

### Code

Inline \`code\` and code blocks:

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): User {
  // Implementation
  return { id, name: 'John Doe', email: 'john@example.com' };
}
\`\`\`

### Blockquotes

> Important information or quotes can be highlighted using blockquotes.
> 
> They can span multiple paragraphs.

### Tables

| Feature | Support | Notes |
|---------|---------|-------|
| Tables  | ✅      | With alignment |
| Lists   | ✅      | Nested support |
| Code    | ✅      | Syntax highlighting |

### Links

[Visit our website](https://example.com) for more information.`
  }
};

export const WithCustomClass: Story = {
  args: {
    markdown: '# Custom Styled Markdown\n\nThis example has a custom class applied.',
    className: 'bg-gray-100 p-4 rounded-md'
  }
};

export const WithLoader: Story = {
  args: {
    markdown: '# Loading Example\n\nThis example shows the loader state.',
    showLoader: true
  }
};
