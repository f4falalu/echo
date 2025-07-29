import { describe, expect, test } from 'vitest';
import {
  type HeaderElement,
  HeaderElementSchema,
  type ImageElement,
  type ListElement,
  ListElementSchema,
  ListItemElement,
  type ParagraphElement,
  ParagraphElementSchema,
  type ReportElements,
  ReportElementsSchema,
} from './report-elements';

describe('ParagraphElementSchema', () => {
  test('should parse anchor schema', () => {
    const baseTest: ParagraphElement = {
      children: [
        {
          text: 'Experience a modern rich-text editor built with ',
        },
        {
          children: [
            {
              text: 'Slate',
            },
          ],
          type: 'a',
          url: 'https://slatejs.org',
        },
        {
          text: ' and ',
        },
        {
          children: [
            {
              text: 'React',
            },
          ],
          type: 'a',
          url: 'https://reactjs.org',
        },
        {
          text: ". This playground showcases just a part of Plate's capabilities. ",
        },
        {
          children: [
            {
              text: 'Explore the documentation',
            },
          ],
          type: 'a',
          url: '/docs',
        },
        {
          text: ' to discover more.',
        },
      ],
      type: 'p',
    };

    const result = ParagraphElementSchema.safeParse(baseTest);
    expect(result.success).toBe(true);
  });

  test('should parse paragraph schema with mention', () => {
    const baseTest: ParagraphElement = {
      children: [
        {
          text: 'Create ',
        },
        {
          children: [
            {
              text: 'links',
            },
          ],
          type: 'a',
          url: '/docs/link',
        },
        {
          text: ', ',
        },
        {
          children: [
            {
              children: [
                {
                  text: '',
                },
              ],
              type: 'mention',
              value: 'mention',
            },
          ],
          type: 'a',
          url: '/docs/mention',
        },
        {
          text: ' users like ',
        },
        {
          children: [
            {
              text: '',
            },
          ],
          type: 'mention',
          value: 'Alice',
          key: 'Alice',
        },
        {
          text: ', or insert ',
        },
        {
          children: [
            {
              text: 'emojis',
            },
          ],
          type: 'a',
          url: '/docs/emoji',
        },
        {
          text: ' ✨. Use the ',
        },
        {
          children: [
            {
              text: 'slash command',
            },
          ],
          type: 'a',
          url: '/docs/slash-command',
        },
        {
          text: ' (/) for quick access to elements.',
        },
      ],
      type: 'p',
    };

    const result = ParagraphElementSchema.safeParse(baseTest);
    expect(result.success).toBe(true);
  });
});

describe('ReportNodeSchema', () => {
  test('should parse report node', () => {
    const baseTest: ReportElements = [
      {
        children: [
          {
            text: 'Welcome to the Plate Playground!',
          },
        ],
        type: 'h1',
      },
      {
        children: [
          {
            text: 'Experience a modern rich-text editor built with ',
          },
          {
            children: [
              {
                text: 'Slate',
              },
            ],
            type: 'a',
            url: 'https://slatejs.org',
          },
          {
            text: ' and ',
          },
          {
            children: [
              {
                text: 'React',
              },
            ],
            type: 'a',
            url: 'https://reactjs.org',
          },
          {
            text: ". This playground showcases just a part of Plate's capabilities. ",
          },
          {
            children: [
              {
                text: 'Explore the documentation',
              },
            ],
            type: 'a',
            url: '/docs',
          },
          {
            text: ' to discover more.',
          },
        ],
        type: 'p',
      },
    ];

    const result = ReportElementsSchema.safeParse(baseTest);

    expect(result.success).toBe(true);
  });

  test('should parse report with header', () => {
    const baseTest: ReportElements = [
      {
        children: [
          {
            text: 'Table of Contents',
          },
        ],
        type: 'h3',
      },
    ];

    const result = ReportElementsSchema.safeParse(baseTest);

    expect(result.success).toBe(true);
  });
});

describe('ListItemSchema', () => {
  test('should parse list item schema', () => {
    const baseTest: ListElement = {
      children: [
        {
          children: [
            {
              children: [
                {
                  text: 'Generate content (continue writing, summarize, explain)',
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
                  text: 'Edit existing text (improve, fix grammar, change tone)',
                },
              ],
              type: 'lic',
            },
          ],
          type: 'li',
        },
      ],
      type: 'ul',
    };

    const result = ListElementSchema.safeParse(baseTest);
    expect(result.success).toBe(true);
  });
});

describe('ImageSchema', () => {
  test('should parse image schema', () => {
    const baseTest: ImageElement = {
      caption: [
        {
          text: '',
        },
      ],
      children: [
        {
          text: '',
        },
      ],
      type: 'img',
      url: 'https://images.unsplash.com/photo-1712688930249-98e1963af7bd?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    };
  });
});

describe('Header Schema', () => {
  test('should parse header schema', () => {
    const baseTest: HeaderElement = {
      children: [
        {
          text: 'Table of Contents',
        },
      ],
      type: 'h3',
    };

    const result = HeaderElementSchema.safeParse(baseTest);
    expect(result.success).toBe(true);
  });
});
