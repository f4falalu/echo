'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/classMerge';
import { cva, type VariantProps } from 'class-variance-authority';
import { inputVariants } from './Input';

const inputTextAreaVariants = inputVariants;

interface AutoResizeOptions {
  minRows?: number;
  maxRows?: number;
}

export interface InputTextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof inputTextAreaVariants> {
  autoResize?: AutoResizeOptions;
}

export const InputTextArea = React.forwardRef<HTMLTextAreaElement, InputTextAreaProps>(
  ({ className, variant = 'default', autoResize, style, rows = 1, ...props }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const combinedRef = (node: HTMLTextAreaElement) => {
      textareaRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    const calculateMinHeight = () => {
      const textarea = textareaRef.current;
      if (!textarea || !autoResize) return null;

      const computedStyle = window.getComputedStyle(textarea);
      const lineHeight =
        parseFloat(computedStyle.lineHeight) || parseFloat(computedStyle.fontSize) * 1.2;
      const paddingTop = parseFloat(computedStyle.paddingTop);
      const paddingBottom = parseFloat(computedStyle.paddingBottom);

      return (autoResize.minRows || rows) * lineHeight + paddingTop + paddingBottom;
    };

    const adjustHeight = () => {
      const textarea = textareaRef.current;
      if (!textarea || !autoResize) return;

      const minHeight = calculateMinHeight();
      if (!minHeight) return;

      // Reset the height to auto first to shrink properly
      textarea.style.height = 'auto';

      const computedStyle = window.getComputedStyle(textarea);
      const lineHeight =
        parseFloat(computedStyle.lineHeight) || parseFloat(computedStyle.fontSize) * 1.2;
      const maxHeight = autoResize.maxRows
        ? autoResize.maxRows * lineHeight +
          parseFloat(computedStyle.paddingTop) +
          parseFloat(computedStyle.paddingBottom)
        : Infinity;

      // Get the scroll height after resetting to auto
      const scrollHeight = Math.max(textarea.scrollHeight, minHeight);
      const newHeight = Math.min(scrollHeight, maxHeight);

      // Apply the new height
      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    };

    useEffect(() => {
      const textarea = textareaRef.current;
      if (!textarea || !autoResize) return;

      const minHeight = calculateMinHeight();
      if (minHeight) {
        textarea.style.minHeight = `${minHeight}px`;
      }

      // Set initial height
      adjustHeight();

      // Add event listeners
      const handleInput = () => {
        requestAnimationFrame(adjustHeight);
      };

      textarea.addEventListener('input', handleInput);
      window.addEventListener('resize', adjustHeight);

      return () => {
        textarea.removeEventListener('input', handleInput);
        window.removeEventListener('resize', adjustHeight);
      };
    }, [autoResize]);

    return (
      <textarea
        className={cn(inputTextAreaVariants({ variant }), 'px-5 py-4', className)}
        ref={combinedRef}
        rows={autoResize ? 1 : rows}
        style={{
          resize: 'none',
          ...style
        }}
        {...props}
      />
    );
  }
);

InputTextArea.displayName = 'InputTextArea';
