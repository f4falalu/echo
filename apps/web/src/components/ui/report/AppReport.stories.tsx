import type { Meta, StoryObj } from '@storybook/react';
import type { Value } from 'platejs';
import { AppReport } from './AppReport';

const meta: Meta<typeof AppReport> = {
  title: 'UI/report/AppReport',
  component: AppReport,
  parameters: {
    layout: 'fullscreen'
  },
  decorators: [
    (Story) => (
      <div className="relative overflow-hidden p-18">
        <div className="h-full min-h-[250px] overflow-hidden rounded-lg border">
          <Story />
        </div>
      </div>
    )
  ],
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default']
    },
    readOnly: {
      control: { type: 'boolean' }
    },
    placeholder: {
      control: { type: 'text' }
    },
    className: {
      control: { type: 'text' }
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

const initialValue: Value = [
  {
    children: [{ text: 'Title' }],
    type: 'h3'
  },
  {
    children: [{ text: 'This is a quote.' }],
    type: 'blockquote'
  },
  {
    children: [
      { text: 'With some ' },
      { bold: true, text: 'bold' },
      { text: ' text for emphasis!' }
    ],
    type: 'p'
  },
  {
    children: [
      { text: 'Here is another paragraph with ' },
      { italic: true, text: 'italic text' },
      { text: ' and ' },
      { underline: true, text: 'underlined text' },
      { text: ' to demonstrate various formatting options.' }
    ],
    type: 'p'
  },
  {
    children: [
      { text: 'This paragraph contains ' },
      { code: true, text: 'inline code' },
      { text: ' and ' },
      { strikethrough: true, text: 'strikethrough text' },
      { text: ' along with ' },
      { highlight: true, text: 'highlighted text' },
      { text: '.' }
    ],
    type: 'p'
  },
  {
    children: [{ text: 'JavaScript Block Example' }],
    type: 'h4'
  },
  {
    children: [
      { children: [{ text: 'function hello() {' }], type: 'code_line' },
      {
        children: [{ text: "  console.info('Code blocks are supported!');" }],
        type: 'code_line'
      },
      { children: [{ text: '}' }], type: 'code_line' }
    ],
    lang: 'javascript',
    type: 'code_block'
  },
  {
    children: [{ text: 'SQL Example' }],
    type: 'h4'
  },
  {
    // Break up the SQL code block into individual code_line elements for each line
    children: [
      { children: [{ text: 'SELECT id, name' }], type: 'code_line' },
      { children: [{ text: 'FROM users' }], type: 'code_line' },
      { children: [{ text: 'WHERE active = true' }], type: 'code_line' },
      { children: [{ text: 'ORDER BY created_at DESC' }], type: 'code_line' },
      { children: [{ text: 'LIMIT 5;' }], type: 'code_line' }
    ],
    type: 'code_block',
    lang: 'sql'
  },
  {
    children: [{ text: 'Unordered List' }],
    type: 'h4'
  },
  {
    children: [{ text: 'Features of this editor:' }],
    type: 'p'
  },
  {
    children: [
      {
        children: [{ text: 'Rich text formatting (bold, italic, underline)' }],
        type: 'li'
      }
    ],
    type: 'ul'
  },
  {
    children: [
      {
        children: [{ text: 'Code blocks with syntax highlighting' }],
        type: 'li'
      }
    ],
    type: 'ul'
  },

  {
    children: [
      {
        children: [{ text: 'Blockquotes and callouts' }],
        type: 'li'
      }
    ],
    type: 'ul'
  },
  {
    children: [
      {
        // Set the icon to a dance emoji to visually enhance the callout
        icon: '💃',
        text: 'This is an informational callout that helps draw attention to important information. You can use callouts to highlight tips, warnings, or key insights throughout your report.'
      }
    ],
    type: 'callout'
  },
  {
    children: [{ text: 'Text Alignment Examples' }],
    type: 'h3'
  },
  {
    children: [
      {
        text: 'This paragraph is left-aligned (default). Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
      }
    ],
    type: 'p',
    align: 'left'
  },
  {
    children: [
      {
        text: 'This paragraph is center-aligned. Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
      }
    ],
    type: 'p',
    align: 'center'
  },
  {
    children: [
      {
        text: 'This paragraph is right-aligned. Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
      }
    ],
    type: 'p',
    align: 'right'
  },
  {
    children: [
      {
        text: 'This paragraph is justified. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.'
      }
    ],
    type: 'p',
    align: 'justify'
  },
  {
    children: [{ text: 'Alignment with Formatted Text' }],
    type: 'h4'
  },
  {
    children: [
      { text: 'This ' },
      { bold: true, text: 'center-aligned' },
      { text: ' paragraph contains ' },
      { italic: true, text: 'various formatting' },
      { text: ' to demonstrate that alignment works with styled text.' }
    ],
    type: 'p',
    align: 'center'
  },
  {
    children: [{ text: 'This is a centered heading' }],
    type: 'h3',
    align: 'center'
  },
  {
    children: [
      {
        text: 'This blockquote is right-aligned to show that alignment works with different block types.'
      }
    ],
    type: 'blockquote',
    align: 'right'
  },
  {
    children: [{ text: 'Table Example' }],
    type: 'h3'
  },
  {
    children: [{ text: 'Here is a sample table with different alignments:' }],
    type: 'p'
  },
  {
    type: 'table',
    children: [
      {
        type: 'tr',
        children: [
          {
            type: 'th',
            children: [{ text: 'Product' }]
          },
          {
            type: 'th',
            children: [{ text: 'Price' }],
            align: 'center'
          },
          {
            type: 'th',
            children: [{ text: 'Stock' }],
            align: 'center'
          },
          {
            type: 'th',
            children: [{ text: 'Description' }]
          }
        ]
      },
      {
        type: 'tr',
        children: [
          {
            type: 'td',
            children: [{ text: 'Laptop Pro' }]
          },
          {
            type: 'td',
            children: [{ text: '$1,299.99' }],
            align: 'right'
          },
          {
            type: 'td',
            children: [{ text: '15' }],
            align: 'center'
          },
          {
            type: 'td',
            children: [{ text: 'High-performance laptop with 16GB RAM' }]
          }
        ]
      },
      {
        type: 'tr',
        children: [
          {
            type: 'td',
            children: [{ text: 'Wireless Mouse' }]
          },
          {
            type: 'td',
            children: [{ text: '$29.99' }],
            align: 'right'
          },
          {
            type: 'td',
            children: [{ text: '142' }],
            align: 'center'
          },
          {
            type: 'td',
            children: [{ text: 'Ergonomic design with long battery life' }]
          }
        ]
      },
      {
        type: 'tr',
        children: [
          {
            type: 'td',
            children: [{ text: 'USB-C Hub' }]
          },
          {
            type: 'td',
            children: [{ text: '$49.99' }],
            align: 'right'
          },
          {
            type: 'td',
            children: [{ text: '0' }],
            align: 'center'
          },
          {
            type: 'td',
            children: [{ text: 'Out of stock - ' }, { text: 'Coming soon!', italic: true }]
          }
        ]
      },
      {
        type: 'tr',
        children: [
          {
            type: 'td',
            children: [{ text: 'Mechanical Keyboard', bold: true }]
          },
          {
            type: 'td',
            children: [{ text: '$159.99' }],
            align: 'right'
          },
          {
            type: 'td',
            children: [{ text: '28' }],
            align: 'center'
          },
          {
            type: 'td',
            children: [{ text: 'RGB backlit with Cherry MX switches' }]
          }
        ]
      }
    ]
  }
  //   {
  //     children: [{ text: 'Ordered List' }],
  //     type: 'h4'
  //   },
  //   {
  //     children: [{ text: 'Steps to create a great report:' }],
  //     type: 'p'
  //   },
  //   {
  //     children: [
  //       {
  //         children: [{ text: 'Start with a clear title and introduction' }],
  //         type: 'li'
  //       }
  //     ],
  //     type: 'ol'
  //   },
  //   {
  //     children: [
  //       {
  //         children: [{ text: 'Organize content with headings and subheadings' }],
  //         type: 'li'
  //       }
  //     ],
  //     type: 'ol'
  //   },
  //   {
  //     children: [
  //       {
  //         children: [{ text: 'Use formatting to emphasize key points' }],
  //         type: 'li'
  //       }
  //     ],
  //     type: 'ol'
  //   },
  //   {
  //     children: [
  //       {
  //         children: [{ text: 'Include code examples when relevant' }],
  //         type: 'li'
  //       }
  //     ],
  //     type: 'ol'
  //   },
  //   {
  //     children: [
  //       {
  //         children: [{ text: 'Conclude with a summary or call to action' }],
  //         type: 'li'
  //       }
  //     ],
  //     type: 'ol'
  //   },
  //   {
  //     children: [{ text: 'Important Note' }],
  //     type: 'h4'
  //   },
  //   {
  //     children: [
  //       {
  //         text: 'This is the final paragraph of our sample content. It demonstrates how all these different content types can work together to create a comprehensive and well-formatted document.'
  //       }
  //     ],
  //     type: 'p'
  //   }
];

export const Default: Story = {
  args: {
    value: initialValue,
    placeholder: 'Start typing your report...',
    readonly: false,
    variant: 'default'
  }
};
