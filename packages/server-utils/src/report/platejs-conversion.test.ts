import type { ReportElements } from '@buster/database';
import { describe, expect, it } from 'vitest';
import { markdownToPlatejs, platejsToMarkdown } from './platejs-conversions';

describe('markdownToPlatejs', () => {
  it('should convert elaborate markdown to platejs', async () => {
    const markdown = `# Welcome to the Plate Playground!

Experience a modern rich-text editor built with [Slate](https://slatejs.org) and [React](https://reactjs.org). This playground showcases just a part of Plate's capabilities. [Explore the documentation](/docs) to discover more.

## Collaborative Editing

Review and refine content seamlessly. Use [](/docs/suggestion) or to . Discuss changes using [comments](/docs/comment) on many text segments. You can even have  annotations!

## AI-Powered Editing

Boost your productivity with integrated [AI SDK](/docs/ai). Press <kbd>⌘+J</kbd> or <kbd>Space</kbd> in an empty line to:

* Generate content (continue writing, summarize, explain)
* Edit existing text (improve, fix grammar, change tone)

## Rich Content Editing

Structure your content with [headings](/docs/heading), [lists](/docs/list), and [quotes](/docs/blockquote). Apply [marks](/docs/basic-marks) like **bold**, _italic_, <u>underline</u>, ~~strikethrough~~, and \`code\`. Use [autoformatting](/docs/autoformat) for [Markdown](/docs/markdown)-like shortcuts (e.g., <kbd>\\*</kbd>  for lists, <kbd>#</kbd>  for H1).

> Blockquotes are great for highlighting important information.

\`\`\`javascript
function hello() {
  console.info('Code blocks are supported!');
}
\`\`\`

Create [links](/docs/link), [@mention](/docs/mention) users like [Alice](mention:Alice), or insert [emojis](/docs/emoji) ✨. Use the [slash command](/docs/slash-command) (/) for quick access to elements.

### How Plate Compares

Plate offers many features out-of-the-box as free, open-source plugins.

| **Feature**         | **Plate (Free & OSS)** | **Tiptap**            |
| ------------------- | ---------------------- | --------------------- |
| AI                  | ✅                      | Paid Extension        |
| Comments            | ✅                      | Paid Extension        |
| Suggestions         | ✅                      | Paid (Comments Pro)   |
| Emoji Picker        | ✅                      | Paid Extension        |
| Table of Contents   | ✅                      | Paid Extension        |
| Drag Handle         | ✅                      | Paid Extension        |
| Collaboration (Yjs) | ✅                      | Hocuspocus (OSS/Paid) |

### Images and Media

Embed rich media like images directly in your content. Supports [Media uploads](/docs/media) and [drag & drop](/docs/dnd) for a smooth experience.

![](https://images.unsplash.com/photo-1712688930249-98e1963af7bd?q=80\\&w=600\\&auto=format\\&fit=crop\\&ixlib=rb-4.0.3\\&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)

<file isUpload="true" name="sample.pdf" src="https://s26.q4cdn.com/900411403/files/doc_downloads/test.pdf" />

<audio src="https://samplelib.com/lib/preview/mp3/sample-3s.mp3" />

### Table of Contents

<toc />

Here's an unordered list:

* First item with \`code snippet\`
* Second item with **bold text**
* Third item with _italic text_
* Nested item 1
* Nested item 2`;
    const platejs = await markdownToPlatejs(markdown);
    expect(platejs).toBeDefined();
  });

  it('real world markdown', async () => {
    const markdown = `Our most popular mountain bike over the last 12 months is Mountain-200 Black, 38 with 825 units sold.
## Key Findings
- The top-selling mountain bike model is **Mountain-200 Black, 38**.
- It sold **825 units** in the last 12 months.
## Metric
<metric metricId="d3bf75d2-28f7-408e-93ec-ae06b509ad27" />
## Context
- I focused specifically on complete bicycle products in the **Mountain Bikes** subcategory within the broader **Bikes** category to avoid counting components or frames.
- I measured popularity by **units sold**, which reflects the number of bikes customers purchased.
- Timeframe defaults to the **last 12 months** to show a current view.
## Methodology
- Data sources: Sales order lines and headers, and product catalog tables in the operational analytics database.
- Filters:
  - Product Category = "Bikes"
  - Product Subcategory = "Mountain Bikes"
  - Order Date between CURRENT_DATE - 12 months and CURRENT_DATE
- Calculation:
  - For each mountain bike product, sum of sales order quantities from sales order details.
  - Select the product with the highest total units sold.
- Notes on definitions:
  - "Most popular" defined as highest **units sold**; alternative definitions could use revenue or number of distinct orders, but units sold most directly represents product popularity by volume.
  - Product names are used as the display label to identify the specific model.
- Alternatives considered:
  - Using revenue-based popularity could favor higher-priced bikes; I chose units to avoid price bias.
  - Using the riding discipline filter (e.g., Mountain) was considered, but I used the explicit Mountain Bikes subcategory to exclude components.
`;
    const platejs = await markdownToPlatejs(markdown);
    expect(platejs).toBeDefined();
  });
});

describe('platejsToMarkdown', () => {
  it('should convert platejs to markdown', async () => {
    const markdown = `This is a simple paragraph.\n`;
    const elements: ReportElements = [
      {
        type: 'p',
        children: [
          {
            text: 'This is a simple paragraph.',
          },
        ],
      },
    ];
    const markdown2 = await platejsToMarkdown(elements);
    expect(markdown2).toBe(markdown);
  });

  it('should convert callout platejs element to markdown', async () => {
    const elements: ReportElements = [
      {
        type: 'h1',
        children: [
          {
            text: 'Main Title',
          },
        ],
      },
      {
        type: 'p',
        children: [
          {
            text: 'This paragraph has ',
          },
          {
            text: 'bold text',
            bold: true,
          },
          {
            text: ' in it.',
          },
        ],
      },
    ];
    const markdown2 = await platejsToMarkdown(elements);
    const markdown = `# Main Title\n\nThis paragraph has **bold text** in it.\n`;
    expect(markdown2).toBe(markdown);
  });

  it('should convert callout platejs element to markdown', async () => {
    const elements: ReportElements = [
      {
        type: 'callout',
        icon: '⚠️',
        variant: 'warning',
        children: [
          {
            type: 'p' as const,
            children: [
              {
                text: 'This is a simple paragraph.',
              },
            ],
          },
        ],
      },
    ];
    const markdownFromPlatejs = await platejsToMarkdown(elements);

    const expectedMarkdown = `<callout icon="⚠️">This is a simple paragraph.\n</callout>\n`;
    expect(markdownFromPlatejs).toBe(expectedMarkdown);
  });

  it('should convert callout platejs element to markdown', async () => {
    const elements: ReportElements = [
      {
        children: [
          {
            text: 'Our most popular mountain bike over the last 12 months is Mountain-200 Black, 38 with 825 units sold.',
          },
        ],
        type: 'p',
      },
      {
        children: [
          {
            text: 'Key Findings',
          },
        ],
        type: 'h2',
      },
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    text: 'The top-selling mountain bike model is ',
                  },
                  {
                    bold: true,
                    text: 'Mountain-200 Black, 38',
                  },
                  {
                    text: '.',
                  },
                ],
                type: 'lic',
              },
            ],
            type: 'li',
          },
          {
            children: [
              {
                children: [
                  {
                    text: 'It sold ',
                  },
                  {
                    bold: true,
                    text: '825 units',
                  },
                  {
                    text: ' in the last 12 months.',
                  },
                ],
                type: 'lic',
              },
            ],
            type: 'li',
          },
        ],
        type: 'ul',
      },
      {
        children: [
          {
            text: 'Metric',
          },
        ],
        type: 'h2',
      },
      {
        children: [
          {
            text: '<metric>\n',
          },
          {
            text: '',
          },
          {
            text: '\n</metric>',
          },
        ],
        type: 'p',
      },
      {
        children: [
          {
            text: 'Context',
          },
        ],
        type: 'h2',
      },
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    text: 'I focused specifically on complete bicycle products in the ',
                  },
                  {
                    bold: true,
                    text: 'Mountain Bikes',
                  },
                  {
                    text: ' subcategory within the broader ',
                  },
                  {
                    bold: true,
                    text: 'Bikes',
                  },
                  {
                    text: ' category to avoid counting components or frames.',
                  },
                ],
                type: 'lic',
              },
            ],
            type: 'li',
          },
          {
            children: [
              {
                children: [
                  {
                    text: 'I measured popularity by ',
                  },
                  {
                    bold: true,
                    text: 'units sold',
                  },
                  {
                    text: ', which reflects the number of bikes customers purchased.',
                  },
                ],
                type: 'lic',
              },
            ],
            type: 'li',
          },
          {
            children: [
              {
                children: [
                  {
                    text: 'Timeframe defaults to the ',
                  },
                  {
                    bold: true,
                    text: 'last 12 months',
                  },
                  {
                    text: ' to show a current view.',
                  },
                ],
                type: 'lic',
              },
            ],
            type: 'li',
          },
        ],
        type: 'ul',
      },
      {
        children: [
          {
            text: 'Methodology',
          },
        ],
        type: 'h2',
      },
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    text: 'Data sources: Sales order lines and headers, and product catalog tables in the operational analytics database.',
                  },
                ],
                type: 'lic',
              },
            ],
            type: 'li',
          },
          {
            children: [
              {
                children: [
                  {
                    text: 'Filters:',
                  },
                ],
                type: 'lic',
              },
              {
                children: [
                  {
                    children: [
                      {
                        children: [
                          {
                            text: 'Product Category = "Bikes"',
                          },
                        ],
                        type: 'lic',
                      },
                    ],
                    type: 'li',
                  },
                  {
                    children: [
                      {
                        children: [
                          {
                            text: 'Product Subcategory = "Mountain Bikes"',
                          },
                        ],
                        type: 'lic',
                      },
                    ],
                    type: 'li',
                  },
                  {
                    children: [
                      {
                        children: [
                          {
                            text: 'Order Date between CURRENT_DATE - 12 months and CURRENT_DATE',
                          },
                        ],
                        type: 'lic',
                      },
                    ],
                    type: 'li',
                  },
                ],
                type: 'ul',
              },
            ],
            type: 'li',
          },
          {
            children: [
              {
                children: [
                  {
                    text: 'Calculation:',
                  },
                ],
                type: 'lic',
              },
              {
                children: [
                  {
                    children: [
                      {
                        children: [
                          {
                            text: 'For each mountain bike product, sum of sales order quantities from sales order details.',
                          },
                        ],
                        type: 'lic',
                      },
                    ],
                    type: 'li',
                  },
                  {
                    children: [
                      {
                        children: [
                          {
                            text: 'Select the product with the highest total units sold.',
                          },
                        ],
                        type: 'lic',
                      },
                    ],
                    type: 'li',
                  },
                ],
                type: 'ul',
              },
            ],
            type: 'li',
          },
          {
            children: [
              {
                children: [
                  {
                    text: 'Notes on definitions:',
                  },
                ],
                type: 'lic',
              },
              {
                children: [
                  {
                    children: [
                      {
                        children: [
                          {
                            text: '"Most popular" defined as highest ',
                          },
                          {
                            bold: true,
                            text: 'units sold',
                          },
                          {
                            text: '; alternative definitions could use revenue or number of distinct orders, but units sold most directly represents product popularity by volume.',
                          },
                        ],
                        type: 'lic',
                      },
                    ],
                    type: 'li',
                  },
                  {
                    children: [
                      {
                        children: [
                          {
                            text: 'Product names are used as the display label to identify the specific model.',
                          },
                        ],
                        type: 'lic',
                      },
                    ],
                    type: 'li',
                  },
                ],
                type: 'ul',
              },
            ],
            type: 'li',
          },
          {
            children: [
              {
                children: [
                  {
                    text: 'Alternatives considered:',
                  },
                ],
                type: 'lic',
              },
              {
                children: [
                  {
                    children: [
                      {
                        children: [
                          {
                            text: 'Using revenue-based popularity could favor higher-priced bikes; I chose units to avoid price bias.',
                          },
                        ],
                        type: 'lic',
                      },
                    ],
                    type: 'li',
                  },
                  {
                    children: [
                      {
                        children: [
                          {
                            text: 'Using the riding discipline filter (e.g., Mountain) was considered, but I used the explicit Mountain Bikes subcategory to exclude components.',
                          },
                        ],
                        type: 'lic',
                      },
                    ],
                    type: 'li',
                  },
                ],
                type: 'ul',
              },
            ],
            type: 'li',
          },
        ],
        type: 'ul',
      },
    ];
  });
});
