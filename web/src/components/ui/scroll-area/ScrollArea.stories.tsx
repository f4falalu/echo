import type { Meta, StoryObj } from '@storybook/react';
import { ScrollArea } from './ScrollArea';

const meta = {
  title: 'UI/ScrollArea/ScrollArea',
  component: ScrollArea,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-[200px] w-[350px] rounded-md border p-4">
      <div>
        <p className="mb-4">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget
          ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies nisl nisl eget nisl.
        </p>
        <p className="mb-4">
          Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque
          laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi
          architecto beatae vitae dicta sunt explicabo.
        </p>
        <p className="mb-4">
          Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia
          consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
        </p>
        <p className="mb-4">
          Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci
          velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam
          quaerat voluptatem.
        </p>
        <p>
          Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam,
          nisi ut aliquid ex ea commodi consequatur.
        </p>
      </div>
    </ScrollArea>
  )
};

export const TallContent: Story = {
  render: () => (
    <ScrollArea className="h-[200px] w-[350px] rounded-md border p-4">
      <div>
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className="mb-2">
            Row {i + 1}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
};

export const WideContent: Story = {
  render: () => (
    <ScrollArea className="h-[200px] w-[350px] rounded-md border p-4">
      <div className="w-[500px]">
        <p className="mb-4">
          This content is intentionally wider than the container to demonstrate horizontal
          scrolling. The ScrollArea component will automatically add scrollbars as needed.
        </p>
        <div className="flex space-x-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-md bg-gray-200">
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  )
};

export const CustomHeight: Story = {
  render: () => (
    <ScrollArea className="h-[400px] w-[350px] rounded-md border p-4">
      <div>
        <p className="mb-4 text-lg font-semibold">Taller Scroll Area</p>
        {Array.from({ length: 20 }).map((_, i) => (
          <p key={i} className="mb-4">
            Paragraph {i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
        ))}
      </div>
    </ScrollArea>
  )
};

export const NestedContent: Story = {
  render: () => (
    <ScrollArea className="h-[300px] w-[400px] rounded-md border p-4">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Nested Content Example</h3>
        <div className="mb-4">
          <p className="mb-2">Main content area with some text.</p>
          <div className="rounded-md border p-2">
            <h4 className="mb-2 font-medium">Nested Section</h4>
            <p>This is nested content inside the scroll area.</p>
          </div>
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="mb-4">
            <h4 className="mb-1 font-medium">Section {i + 1}</h4>
            <p>Additional content for demonstrating scrolling behavior.</p>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
};
