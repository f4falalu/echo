'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { InputTagInput } from './InputTagInput';
import { useState } from 'react';
import React from 'react';

const meta: Meta<typeof InputTagInput> = {
  title: 'UI/Inputs/InputTagInput',
  component: InputTagInput,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'ghost', 'single']
    },
    size: {
      control: 'select',
      options: ['default', 'tall', 'small']
    },
    disabled: {
      control: 'boolean'
    },
    placeholder: {
      control: 'text'
    },
    maxTags: {
      control: 'number'
    }
  }
};

export default meta;
type Story = StoryObj<typeof InputTagInput>;

// Interactive component for Storybook
const InteractiveTagInput = (args: React.ComponentProps<typeof InputTagInput>) => {
  const [tags, setTags] = useState<string[]>(args.tags || []);

  const handleTagAdd = (tag: string) => {
    setTags([...tags, tag]);
  };

  const handleTagRemove = (index: number) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    setTags(newTags);
  };

  return (
    <InputTagInput {...args} tags={tags} onTagAdd={handleTagAdd} onTagRemove={handleTagRemove} />
  );
};

export const Default: Story = {
  render: (args) => <InteractiveTagInput {...args} />,
  args: {
    placeholder: 'Add tags...',
    tags: ['React', 'TypeScript']
  }
};

export const Ghost: Story = {
  render: (args) => <InteractiveTagInput {...args} />,
  args: {
    variant: 'ghost',
    placeholder: 'Add tags...',
    tags: ['Ghost', 'Variant']
  }
};

export const Tall: Story = {
  render: (args) => <InteractiveTagInput {...args} />,
  args: {
    size: 'tall',
    placeholder: 'Add tags...',
    tags: ['Tall', 'Size']
  }
};

export const Small: Story = {
  render: (args) => <InteractiveTagInput {...args} />,
  args: {
    size: 'small',
    placeholder: 'Add tags...',
    tags: ['Small', 'Size']
  }
};

export const Disabled: Story = {
  render: (args) => <InteractiveTagInput {...args} />,
  args: {
    disabled: true,
    placeholder: 'Disabled input',
    tags: ['Cannot', 'Edit', 'These']
  }
};

export const MaxTags: Story = {
  render: (args) => <InteractiveTagInput {...args} />,
  args: {
    maxTags: 3,
    placeholder: 'Maximum 3 tags...',
    tags: ['First', 'Second']
  }
};

export const Empty: Story = {
  render: (args) => <InteractiveTagInput {...args} />,
  args: {
    placeholder: 'Start typing to add tags...',
    tags: []
  }
};
