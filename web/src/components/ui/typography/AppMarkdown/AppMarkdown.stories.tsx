import type { Meta, StoryObj } from '@storybook/react';
import { AppMarkdown } from './AppMarkdown';
import { Button } from '@/components/ui/buttons';
import { useState } from 'react';
import { Checkbox } from '../../checkbox';
import { Switch } from '../../switch/Switch';

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
    },
    stripFormatting: {
      control: 'boolean',
      description: 'Whether to strip formatting'
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
  console.wow('Hello, world!');
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

const randomMarkdownContent = [
  '# New Section\n\nThis is a new section with some content.',
  '## Subheading\n\nHere is a paragraph with **bold** and *italic* text.',
  '### Smaller Heading\n\n- List item 1\n- List item 2\n- List item 3',
  '#### Tiny Heading\n\n> This is a blockquote with some important information.',
  '##### Micro Heading\n\n1. Numbered item 1\n2. Numbered item 2',
  '###### Nano Heading\n\n`code example` and more text here.',
  '## Table Example\n\n| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |',
  '### Mixed Content\n\nHere is some text with [a link](https://example.com) and `inline code`.'
];

const InteractiveMarkdown = () => {
  const [markdown, setMarkdown] = useState(
    '# Interactive Markdown\n\nClick the button to add more content!'
  );
  const [stripFormatting, setStripFormatting] = useState(false);

  const addRandomContent = () => {
    const randomContent =
      randomMarkdownContent[Math.floor(Math.random() * randomMarkdownContent.length)];
    setMarkdown((prev) => `${prev}\n\n${randomContent}`);
  };

  return (
    <div className="space-y-4">
      <Button onClick={addRandomContent}>Add Random Content</Button>

      <div className="flex items-center gap-2">
        <span>Strip Formatting</span>
        <Switch checked={stripFormatting} onCheckedChange={setStripFormatting}></Switch>
      </div>
      <AppMarkdown markdown={markdown} showLoader stripFormatting={stripFormatting} />
    </div>
  );
};

export const WithLoader: Story = {
  render: () => <InteractiveMarkdown />
};

export const WithProblematicReasoningMarkdown: Story = {
  args: {
    markdown: `**Thought**:
The goal is to build a comprehensive dashboard on product sales YTD. The dashboard will provide insights into overall sales trends, which products contribute most (top 10) and least (bottom 10), who the top salespeople and customers are, and some categorical breakdown based on product categories. We will focus on data from product sales (using sales orders, transaction history, and product information) and restrict visualizations to top and bottom 10 products wherever applicable.

**Step-by-Step Plan**:
1. **Create 8 Visualizations**:
   - **Title**: 'YTD Sales Trend'
     - **Type**: Line Chart
     - **Datasets**: entity_sales_order (or entity_transaction_history)
     - **Expected Output**: A line chart showing total sales amounts aggregated over time from the beginning of the year to date, with dates on the x-axis and total revenue on the y-axis.
   
   - **Title**: 'Total Sales YTD'
     - **Type**: Number Card
     - **Datasets**: entity_sales_order (or entity_transaction_history)
     - **Expected Output**: A number card displaying the cumulative sales revenue from the beginning of the year until now.
   
   - **Title**: 'Top 10 Products by Revenue'
     - **Type**: Bar Chart
     - **Datasets**: entity_sales_order, entity_product
     - **Expected Output**: A bar chart showing the top 10 products (by product name) with the highest total revenue; x-axis as product names, y-axis as sales revenue.
   
   - **Title**: 'Bottom 10 Products by Revenue'
     - **Type**: Bar Chart
     - **Datasets**: entity_sales_order, entity_product
     - **Expected Output**: A bar chart showing the bottom 10 products (by product name) with the lowest sales revenue; x-axis as product names, y-axis as sales revenue. Only include products in the top and bottom groups.
   
   - **Title**: 'Top Salespeople YTD'
     - **Type**: Bar Chart
     - **Datasets**: entity_sales_order, entity_sales_person
     - **Expected Output**: A bar chart displaying sales by each salesperson (using first and last name combined) ranked by total sales revenue for the year-to-date.
   
   - **Title**: 'Top Customers YTD'
     - **Type**: Bar Chart
     - **Datasets**: entity_sales_order, entity_customer
     - **Expected Output**: A bar chart showing the top customers based on the amount they spent, with customer full names on the x-axis and revenue on the y-axis.
   
   - **Title**: 'Sales by Product Category'
     - **Type**: Bar Chart
     - **Datasets**: entity_sales_order, entity_product
     - **Expected Output**: A bar chart that groups sales revenue by product category, with categories on the x-axis and total revenue on the y-axis. This visualization is filtered to include only products from the top 10 and bottom 10 groups.
   
   - **Title**: 'Monthly Sales Trend for Top/Bottom Products'
     - **Type**: Line Chart
     - **Datasets**: entity_sales_order, entity_product
     - **Expected Output**: A line chart with monthly breakdown (months on the x-axis) showing sales trends for the products in the top 10 and bottom 10 groups, with separate lines representing each product (displaying product names).

2. **Create Dashboard**:
   - Title the dashboard "Product Sales Overview - YTD (Top & Bottom 10)"
   - Add and arrange all eight visualizations on the dashboard to provide a comprehensive view of overall product sales, important sellers and buyers, and categorical insights focused on the top and bottom 10 products.

3. **Review & Finish**:
   - Verify that each visualization returns relevant and non-empty data, and that filters restrict views to the top 10 and bottom 10 products where applicable.
   - Confirm that names are displayed instead of IDs in all visualizations.

**Notes**:
- Assumption: YTD refers to data from January 1st up to the current date.
- The top 10 and bottom 10 products are determined based on total sales revenue.
- Sales orders schema is used for sales figures while product details provide categorical info.
- The dataset relationships have been confirmed in the data catalog.

This plan should provide a clear and comprehensive dashboard covering overall sales trends, key players in both sales and buying, and categorical breakdown for the top and bottom 10 products.`
  }
};

export const WithHiddenNewlines: Story = {
  args: {
    markdown: 'This is line one.\nThis is line two.\nThis is line three.',
    className: 'whitespace-pre-wrap'
  }
};
