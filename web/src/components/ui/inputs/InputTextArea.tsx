'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/classMerge';
import { cva, type VariantProps } from 'class-variance-authority';
import { inputVariants } from './Input';
import { useMemoizedFn } from 'ahooks';

const inputTextAreaVariants = inputVariants;

interface AutoResizeOptions {
  minRows?: number;
  maxRows?: number;
}

interface PaddingValues {
  top: number;
  bottom: number;
}

export interface InputTextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof inputTextAreaVariants> {
  autoResize?: AutoResizeOptions;
  onPressMetaEnter?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export const InputTextArea = React.forwardRef<HTMLTextAreaElement, InputTextAreaProps>(
  ({ className, variant = 'default', autoResize, style, rows = 1, ...props }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const paddingRef = useRef<PaddingValues | null>(null);

    const combinedRef = useMemoizedFn((node: HTMLTextAreaElement) => {
      textareaRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    });

    const getPaddingValues = useMemoizedFn(() => {
      if (paddingRef.current) return paddingRef.current;

      const textarea = textareaRef.current;
      if (!textarea) return { top: 0, bottom: 0 };

      const computedStyle = window.getComputedStyle(textarea);
      paddingRef.current = {
        top: parseFloat(computedStyle.paddingTop),
        bottom: parseFloat(computedStyle.paddingBottom)
      };
      return paddingRef.current;
    });

    const calculateMinHeight = useMemoizedFn(() => {
      const textarea = textareaRef.current;
      if (!textarea || !autoResize) return null;

      const computedStyle = window.getComputedStyle(textarea);
      const lineHeight =
        parseFloat(computedStyle.lineHeight) || parseFloat(computedStyle.fontSize) * 1.2;
      const { top, bottom } = getPaddingValues();

      return (autoResize.minRows || rows) * lineHeight + top + bottom;
    });

    const adjustHeight = useMemoizedFn(() => {
      const textarea = textareaRef.current;
      if (!textarea || !autoResize) return;

      const minHeight = calculateMinHeight();
      if (!minHeight) return;

      textarea.style.height = 'auto';

      const computedStyle = window.getComputedStyle(textarea);
      const lineHeight =
        parseFloat(computedStyle.lineHeight) || parseFloat(computedStyle.fontSize) * 1.2;
      const { top, bottom } = getPaddingValues();
      const maxHeight = autoResize.maxRows
        ? autoResize.maxRows * lineHeight + top + bottom
        : Infinity;

      const scrollHeight = Math.max(textarea.scrollHeight, minHeight);
      const newHeight = Math.min(scrollHeight, maxHeight);

      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    });

    const handleInput = useMemoizedFn(() => {
      requestAnimationFrame(adjustHeight);
    });

    const onPressMetaEnter = useMemoizedFn((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.metaKey && e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        onPressMetaEnter?.(e);
      }
    });

    useEffect(() => {
      const textarea = textareaRef.current;
      if (!textarea || !autoResize) return;

      const minHeight = calculateMinHeight();
      if (minHeight) {
        textarea.style.minHeight = `${minHeight}px`;
      }

      // Set initial height
      adjustHeight();

      textarea.addEventListener('input', handleInput);
      window.addEventListener('resize', adjustHeight);

      return () => {
        textarea.removeEventListener('input', handleInput);
        window.removeEventListener('resize', adjustHeight);
      };
    }, [autoResize]);

    return (
      <textarea
        ref={combinedRef}
        className={cn(
          inputTextAreaVariants({ variant }),
          'px-5 py-4',
          autoResize && 'resize-none',
          className
        )}
        rows={autoResize ? 1 : rows}
        {...props}
      />
    );
  }
);

InputTextArea.displayName = 'InputTextArea';
