'use client';

import * as React from 'react';
import { Xmark } from '../icons';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useMemoizedFn } from 'ahooks';
import { inputVariants } from './Input';

// Define tag variants that will change based on input size
const tagVariants = cva(
  'bg-item-select text-foreground inline-flex shrink-0 items-center gap-1 rounded px-2 truncate transition-opacity',
  {
    variants: {
      size: {
        default: 'h-5 text-sm',
        tall: 'h-6 text-sm',
        small: 'h-4 text-xs'
      },
      disabled: {
        true: 'opacity-80 cursor-not-allowed',
        false: 'opacity-100'
      }
    },
    defaultVariants: {
      size: 'default',
      disabled: false
    }
  }
);

type TagSize = 'default' | 'tall' | 'small';

const Tag = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    onRemove?: () => void;
    size?: TagSize;
    disabled?: boolean;
  }
>(({ className, onRemove, children, size = 'default', disabled = false, ...props }, ref) => (
  <div ref={ref} className={cn(tagVariants({ size, disabled }), className)} {...props}>
    <span className="truncate">{children}</span>
    {onRemove && !disabled && (
      <button
        type="button"
        onClick={onRemove}
        className="ring-offset-ring focus:ring-ring flex h-4 w-4 cursor-pointer items-center justify-center rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-1 focus:ring-offset-1 focus:outline-none"
        aria-label="Remove tag">
        <div
          className={cn('flex items-center justify-center', {
            'h-3 w-3': size !== 'small',
            'h-2.5 w-2.5': size === 'small'
          })}>
          <Xmark />
        </div>
        <span className="sr-only">Remove</span>
      </button>
    )}
  </div>
));
Tag.displayName = 'Tag';

export interface TagInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
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
      variant = 'default',
      size = 'default',
      tags = [],
      onTagAdd,
      onTagRemove,
      placeholder,
      disabled = false,
      maxTags,
      ...props
    },
    ref
  ) => {
    const [inputValue, setInputValue] = React.useState('');
    const containerRef = React.useRef<HTMLDivElement>(null);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const handleKeyDown = useMemoizedFn((e: React.KeyboardEvent<HTMLInputElement>) => {
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
      } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0 && !disabled) {
        onTagRemove?.(tags.length - 1);
      }
    });

    const handleInputChange = useMemoizedFn((e: React.ChangeEvent<HTMLInputElement>) => {
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
    });

    // Focus the container when clicked
    const handleContainerClick = useMemoizedFn(() => {
      const input = containerRef.current?.querySelector('input');
      if (input && !disabled) {
        input.focus();
      }
    });

    // Add gap classes based on variant
    const gapClasses = variant === 'ghost' ? 'gap-2' : variant === 'default' ? 'gap-2' : 'gap-1';

    // Determine if the component is disabled
    const isDisabled = disabled || (maxTags !== undefined && tags.length >= maxTags);

    return (
      <div
        ref={containerRef}
        className={cn(
          inputVariants({ variant, size }),
          gapClasses,
          'flex items-center',
          isDisabled && 'bg-item-select cursor-not-allowed',
          className
        )}
        onClick={handleContainerClick}>
        <div
          ref={scrollRef}
          className="scrollbar-none flex flex-1 items-center gap-1.5 overflow-x-auto py-1 whitespace-nowrap">
          {tags.map((tag, index) => (
            <Tag
              key={`${tag}-${index}`}
              onRemove={() => onTagRemove?.(index)}
              size={size as TagSize}
              disabled={isDisabled}>
              {tag}
            </Tag>
          ))}
          <input
            ref={ref}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="placeholder:text-gray-light min-w-[120px] flex-1 bg-transparent outline-none disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={tags.length === 0 ? placeholder : undefined}
            disabled={isDisabled}
            {...props}
          />
        </div>
      </div>
    );
  }
);
TagInput.displayName = 'TagInput';

export { Tag, TagInput };
