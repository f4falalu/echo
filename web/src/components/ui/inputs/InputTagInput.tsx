'use client';

import * as React from 'react';
import { Xmark } from '../icons';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const tagInputVariants = cva(
  'flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'gap-2',
        single: 'gap-1'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

const Tag = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    onRemove?: () => void;
  }
>(({ className, onRemove, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'bg-secondary text-secondary-foreground inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-sm',
      className
    )}
    {...props}>
    <span className="truncate">{children}</span>
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        className="ring-offset-background focus:ring-ring flex h-4 w-4 items-center justify-center rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none">
        <div className="flex h-3 w-3 items-center justify-center">
          <Xmark />
        </div>
        <span className="sr-only">Remove</span>
      </button>
    )}
  </div>
));
Tag.displayName = 'Tag';

export interface TagInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof tagInputVariants> {
  tags?: string[];
  onTagAdd?: (tag: string) => void;
  onTagRemove?: (index: number) => void;
  placeholder?: string;
  disabled?: boolean;
  maxTags?: number;
}

const TagInput = React.forwardRef<HTMLInputElement, TagInputProps>(
  (
    {
      className,
      variant,
      tags = [],
      onTagAdd,
      onTagRemove,
      placeholder,
      disabled,
      maxTags,
      ...props
    },
    ref
  ) => {
    const [inputValue, setInputValue] = React.useState('');
    const containerRef = React.useRef<HTMLDivElement>(null);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if ((e.key === 'Tab' || e.key === 'Enter' || e.key === ',') && inputValue.trim() !== '') {
        e.preventDefault();
        const newTag = inputValue.trim();
        if (maxTags && tags.length >= maxTags) return;

        if (!tags.includes(newTag)) {
          onTagAdd?.(newTag);
          setInputValue('');
          // Scroll to the end after adding a new tag
          if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
          }
        }
      } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
        onTagRemove?.(tags.length - 1);
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value.endsWith(',')) {
        const newTag = value.slice(0, -1).trim();
        if (newTag !== '' && !tags.includes(newTag)) {
          if (maxTags && tags.length >= maxTags) return;
          onTagAdd?.(newTag);
          setInputValue('');
          // Scroll to the end after adding a new tag
          if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
          }
        }
      } else {
        setInputValue(value);
      }
    };

    // Focus the container when clicked
    const handleContainerClick = () => {
      const input = containerRef.current?.querySelector('input');
      if (input) {
        input.focus();
      }
    };

    return (
      <div
        ref={containerRef}
        className={cn(tagInputVariants({ variant }), className)}
        onClick={handleContainerClick}>
        <div
          ref={scrollRef}
          className="scrollbar-none flex items-center gap-2 overflow-x-auto py-1.5 whitespace-nowrap">
          {tags.map((tag, index) => (
            <Tag key={`${tag}-${index}`} onRemove={() => onTagRemove?.(index)}>
              {tag}
            </Tag>
          ))}
          <input
            ref={ref}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="placeholder:text-muted-foreground min-w-[120px] flex-1 bg-transparent outline-none disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={tags.length === 0 ? placeholder : undefined}
            disabled={disabled || (maxTags !== undefined && tags.length >= maxTags)}
            {...props}
          />
        </div>
      </div>
    );
  }
);
TagInput.displayName = 'TagInput';

export { Tag, TagInput };
