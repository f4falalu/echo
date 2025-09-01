import { ClientOnly } from '@tanstack/react-router';
import { cva, type VariantProps } from 'class-variance-authority';
import React, { useEffect, useRef } from 'react';
import TextareaAutosize, { type TextareaAutosizeProps } from 'react-textarea-autosize';
import { cn } from '@/lib/classMerge';
import { useMounted } from '../../../hooks/useMount';
import { inputVariants } from './Input';

const inputTextAreaVariants = inputVariants;

const textAreaVariants = cva('leading-1.3', {
  variants: {
    rounding: {
      none: 'rounded-none',
      small: 'rounded-sm!',
      medium: 'rounded-md',
      large: 'rounded-lg',
      xl: 'rounded-xl',
      default: 'rounded',
    },
  },
});

export interface InputTextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    Omit<TextareaAutosizeProps, 'style'>,
    VariantProps<typeof inputTextAreaVariants>,
    VariantProps<typeof textAreaVariants> {
  onPressMetaEnter?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onPressEnter?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export const InputTextArea = React.forwardRef<HTMLTextAreaElement, InputTextAreaProps>(
  (
    {
      className,
      variant = 'default',
      style,
      rows = 1,
      rounding = 'default',
      onPressMetaEnter,
      onPressEnter,
      ...props
    },
    ref
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const combinedRef = (node: HTMLTextAreaElement) => {
      textareaRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter') {
        if ((e.metaKey || e.ctrlKey) && onPressMetaEnter) {
          e.preventDefault();
          onPressMetaEnter(e);
        } else if (!e.shiftKey && onPressEnter) {
          e.preventDefault();
          onPressEnter(e);
        }
      }
      props.onKeyDown?.(e);
    };

    return (
      <TextareaAutosize
        ref={combinedRef}
        className={cn(
          inputTextAreaVariants({ variant }),
          textAreaVariants({ rounding }),
          'px-2.5 py-2.5 resize-none! box-border',
          className
        )}
        value={props.value}
        onKeyDown={handleKeyDown}
        style={style as Omit<React.CSSProperties, 'height'>}
        {...props}
      />
    );
  }
);

InputTextArea.displayName = 'InputTextArea';
