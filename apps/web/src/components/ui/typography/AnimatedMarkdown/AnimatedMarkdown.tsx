'use client';

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useMarkdownComponents } from './useMarkdownComponents';
import { MarkdownAnimation } from './animation-helpers';
import styles from './AnimatedMarkdown.module.css';
import { cn } from '@/lib/classMerge';
import './animations.css';
import { useMount } from '../../../../hooks';

export interface AnimatedMarkdownProps {
  className?: string;
  content: string;
  animation?: MarkdownAnimation;
  animationDuration?: number;
  isStreamFinished: boolean;
  stripFormatting?: boolean;
  animationTimingFunction?: 'ease-in-out' | 'ease-in' | 'ease-out' | 'linear';
}

const remarkPlugins = [remarkGfm];

const AnimatedMarkdown: React.FC<AnimatedMarkdownProps> = ({
  content,
  animation = 'fadeIn',
  animationDuration = 300,
  animationTimingFunction = 'ease-in-out',
  isStreamFinished = true,
  stripFormatting = false,
  className
}) => {
  const { components } = useMarkdownComponents({
    animation,
    animationDuration,
    animationTimingFunction,
    isStreamFinished,
    stripFormatting
  });

  return (
    <div className={cn(styles.container, 'flex flex-col space-y-2 leading-1.5', className)}>
      <ReactMarkdown
        components={components}
        // remarkPlugins are used to extend or modify the Markdown parsing behavior.
        // Here, remarkGfm enables GitHub Flavored Markdown features (like tables, strikethrough, task lists).
        remarkPlugins={remarkPlugins}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default AnimatedMarkdown;
