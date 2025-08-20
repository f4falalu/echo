import type { ReportElementWithId } from '@buster/server-shared/reports';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { ReportEditor } from './ReportEditor';
import { useEffect, useRef, useState } from 'react';
import { useMount } from '@/hooks';
import { cn } from '@/lib/classMerge';

const meta = {
  title: 'UI/report/ReportEditor',
  component: ReportEditor,
  tags: ['autodocs'],
  parameters: {
    msw: {
      handlers: [
        // Mock Supabase auth endpoints to prevent MSW warnings
        // http.post('http://127.0.0.1:54321/auth/v1/token', ({ request }) => {
        //   return HttpResponse.json({
        //     access_token: 'mock_access_token',
        //     token_type: 'bearer',
        //     expires_in: 3600,
        //     refresh_token: 'mock_refresh_token',
        //     user: {
        //       id: 'mock_user_id',
        //       email: 'mock@example.com',
        //       is_anonymous: false
        //     }
        //   });
        // }),
        // http.post('http://127.0.0.1:54321/auth/v1/refresh', ({ request }) => {
        //   return HttpResponse.json({
        //     access_token: 'mock_refreshed_access_token',
        //     token_type: 'bearer',
        //     expires_in: 3600,
        //     refresh_token: 'mock_new_refresh_token',
        //     user: {
        //       id: 'mock_user_id',
        //       email: 'mock@example.com',
        //       is_anonymous: false
        //     }
        //   });
        // }),
        // http.post('http://127.0.0.1:3001/api/v1/search', ({ request }) => {
        //   return HttpResponse.json([]);
        // })
      ]
    }
  },
  decorators: [
    (Story) => (
      <div className="border">
        <Story />
      </div>
    )
  ],
  args: {
    placeholder: 'Start typing...',
    readOnly: false,
    disabled: false,
    variant: 'default'
  }
} satisfies Meta<typeof ReportEditor>;

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
    type: 'img',
    children: [{ text: '' }],
    width: 200,
    url: 'https://picsum.photos/200/200',
    caption: [{ text: 'This is a caption' }]
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
    children: [
      {
        type: 'code_line',
        children: [{ text: 'const greeting = "Hello, World!";' }]
      },
      {
        type: 'code_line',
        children: [{ text: 'console.log(greeting);' }]
      },
      {
        type: 'code_line',
        children: [{ text: '}' }]
      }
    ]
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
    type: 'h1',
    children: [{ text: 'Hello' }]
  },
  // Table Section
  {
    children: [{ text: 'How Plate Compares' }],
    type: 'h3'
  },
  {
    children: [
      {
        text: 'Plate offers many features out-of-the-box as free, open-source plugins.'
      }
    ],
    type: 'p'
  },
  {
    type: 'table',
    children: [
      {
        children: [
          {
            children: [{ bold: true, text: 'Feature' }],
            type: 'th'
          },
          {
            children: [
              {
                children: [{ bold: true, text: 'Plate (Free & OSS)' }],
                type: 'p'
              }
            ],
            type: 'th'
          },
          {
            children: [{ children: [{ bold: true, text: 'Tiptap' }], type: 'p' }],
            type: 'th'
          }
        ],
        type: 'tr'
      },
      {
        children: [
          {
            children: [{ children: [{ text: 'AI' }], type: 'p' }],
            type: 'td'
          },
          {
            children: [
              {
                attributes: { align: 'center' },
                children: [{ text: '✅' }],
                type: 'p'
              }
            ],
            type: 'td'
          },
          {
            children: [{ children: [{ text: 'Paid Extension' }], type: 'p' }],
            type: 'td'
          }
        ],
        type: 'tr'
      },
      {
        children: [
          {
            children: [{ children: [{ text: 'Comments' }], type: 'p' }],
            type: 'td'
          },
          {
            children: [
              {
                attributes: { align: 'center' },
                children: [{ text: '✅' }],
                type: 'p'
              }
            ],
            type: 'td'
          },
          {
            children: [{ children: [{ text: 'Paid Extension' }], type: 'p' }],
            type: 'td'
          }
        ],
        type: 'tr'
      },
      {
        children: [
          {
            children: [{ children: [{ text: 'Suggestions' }], type: 'p' }],
            type: 'td'
          },
          {
            children: [
              {
                attributes: { align: 'center' },
                children: [{ text: '✅' }],
                type: 'p'
              }
            ],
            type: 'td'
          },
          {
            children: [{ children: [{ text: 'Paid (Comments Pro)' }], type: 'p' }],
            type: 'td'
          }
        ],
        type: 'tr'
      },
      {
        children: [
          {
            children: [{ children: [{ text: 'Emoji Picker' }], type: 'p' }],
            type: 'td'
          },
          {
            children: [
              {
                attributes: { align: 'center' },
                children: [{ text: '✅' }],
                type: 'p'
              }
            ],
            type: 'td'
          },
          {
            children: [{ children: [{ text: 'Paid Extension' }], type: 'p' }],
            type: 'td'
          }
        ],
        type: 'tr'
      },
      {
        children: [
          {
            children: [{ children: [{ text: 'Table of Contents' }], type: 'p' }],
            type: 'td'
          },
          {
            children: [
              {
                attributes: { align: 'center' },
                children: [{ text: '✅' }],
                type: 'p'
              }
            ],
            type: 'td'
          },
          {
            children: [{ children: [{ text: 'Paid Extension' }], type: 'p' }],
            type: 'td'
          }
        ],
        type: 'tr'
      },
      {
        children: [
          {
            children: [{ children: [{ text: 'Drag Handle' }], type: 'p' }],
            type: 'td'
          },
          {
            children: [
              {
                attributes: { align: 'center' },
                children: [{ text: '✅' }],
                type: 'p'
              }
            ],
            type: 'td'
          },
          {
            children: [{ children: [{ text: 'Paid Extension' }], type: 'p' }],
            type: 'td'
          }
        ],
        type: 'tr'
      },
      {
        children: [
          {
            children: [{ children: [{ text: 'Collaboration (Yjs)' }], type: 'p' }],
            type: 'td'
          },
          {
            children: [
              {
                attributes: { align: 'center' },
                children: [{ text: '✅' }],
                type: 'p'
              }
            ],
            type: 'td'
          },
          {
            children: [{ children: [{ text: 'Hocuspocus (OSS/Paid)' }], type: 'p' }],
            type: 'td'
          }
        ],
        type: 'tr'
      }
    ]
  }
].map((element, index) => ({
  ...element,
  id: `id-${index}`
})) as ReportElementWithId[];

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

export const WithCustomKit: Story = {
  args: {
    value: [
      {
        type: 'h1',
        children: [{ text: 'Hello' }]
      },
      {
        type: 'metric',
        children: [{ text: '' }],
        metricId: ''
      },
      {
        type: 'characterCounter' as 'p',
        children: [{ text: 'This is my character counter' }]
      },
      {
        type: 'p',
        children: [{ text: 'paragraph test' }]
      },
      {
        type: 'metric',
        children: [{ text: '' }],
        metricId: '1234',
        caption: [{ text: 'This is a caption' }]
      },
      {
        type: 'img',
        children: [{ text: '' }],
        url: 'https://picsum.photos/200/200',
        caption: [{ text: 'This is a caption' }]
      }
    ].map((element, index) => ({
      ...element,
      id: `id-${index}`
    })) as ReportElementWithId[],
    useFixedToolbarKit: true
  }
};

export const WithStreamingContent: Story = {
  args: {
    value: [
      { type: 'h1', children: [{ text: 'Hello' }] },
      { type: 'p', children: [{ text: 'This is a paragraph' }] }
    ].map((element, index) => ({
      ...element,
      id: `id-${index}`
    })) as ReportElementWithId[]
  },
  render: (args) => {
    // This effect simulates streaming content by appending to the current line,
    // and starting a new line every 3 iterations, up to 10 total iterations.
    const [value, setValue] = useState<ReportElementWithId[]>(args.value);
    const iterations = useRef(0);

    const [isRunning, setIsRunning] = useState(false);

    useMount(() => {
      if (iterations.current >= 10 || isRunning) return; // Cancel after 10 iterations

      setIsRunning(true);

      const interval = setInterval(() => {
        setValue((prevValue) => {
          const nextValue = [...prevValue];

          const makeChunk = (i: number) => `chunk ${i}`;
          const shouldStartNewLine = iterations.current % 3 === 0;

          if (shouldStartNewLine) {
            // Start a new paragraph line
            nextValue.push({
              type: 'p',
              children: [{ text: makeChunk(iterations.current) }],
              id: `id-${iterations.current}`
            });
          } else {
            // Append to the current (last) paragraph line
            const lastIndex = nextValue.length - 1;
            const lastBlock = nextValue[lastIndex] as ReportElementWithId | undefined;

            if (lastBlock && lastBlock.type === 'p') {
              const children = Array.isArray((lastBlock as any).children)
                ? [...(lastBlock as any).children]
                : [];

              const lastChildIndex = children.length - 1;
              if (
                lastChildIndex >= 0 &&
                children[lastChildIndex] &&
                typeof children[lastChildIndex].text === 'string'
              ) {
                const existingText = children[lastChildIndex].text as string;
                children[lastChildIndex] = {
                  ...children[lastChildIndex],
                  text: `${existingText} ${makeChunk(iterations.current)}`
                };
              } else {
                children.push({ text: makeChunk(iterations.current) });
              }

              nextValue[lastIndex] = {
                ...(lastBlock as any),
                children
              } as ReportElementWithId;
            } else {
              // If the last block isn't a paragraph, start one
              nextValue.push({
                id: `id-${iterations.current}`,
                type: 'p',
                children: [{ text: makeChunk(iterations.current) }]
              });
            }
          }

          return nextValue;
        });

        iterations.current++;
        if (iterations.current >= 30) {
          clearInterval(interval);
          setIsRunning(false);
        }
      }, 150);

      return () => clearInterval(interval);
    });

    return (
      <div className="flex space-x-4 border">
        <ReportEditor {...args} value={value} readOnly={isRunning} />
        <div className={cn('m-3 border', !isRunning ? 'bg-green-100' : '')}>
          <pre>{JSON.stringify(value, null, 2)}</pre>
        </div>
      </div>
    );
  }
};
