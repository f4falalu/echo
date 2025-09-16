import type React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/classMerge';
import '../animation-common/animations.css'; // Ensure CSS is loaded
import type { MarkdownAnimation } from '../animation-common';
import styles from './AnimatedMarkdown.module.css';
import { useMarkdownComponents } from './useMarkdownComponents';

export interface AnimatedMarkdownProps {
  className?: string;
  content: string;
  animation?: MarkdownAnimation;
  animationDuration?: number;
  isStreamFinished?: boolean;
  stripFormatting?: boolean;
  animationTimingFunction?: 'ease-in-out' | 'ease-in' | 'ease-out' | 'linear';
}

const remarkPlugins = [remarkGfm];

const AnimatedMarkdown: React.FC<AnimatedMarkdownProps> = ({
  content,
  animation = 'none',
  animationDuration = 300,
  animationTimingFunction = 'ease-in-out',
  isStreamFinished = true,
  stripFormatting = true,
  className,
}) => {
  const components = useMarkdownComponents({
    animation,
    animationDuration,
    animationTimingFunction,
    isStreamFinished,
    stripFormatting,
  });

  return (
    <div
      className={cn(styles.container, 'flex flex-col space-y-2 font-sans! leading-1.5', className)}
    >
      <ReactMarkdown
        components={components}
        // remarkPlugins are used to extend or modify the Markdown parsing behavior.
        // Here, remarkGfm enables GitHub Flavored Markdown features (like tables, strikethrough, task lists).
        remarkPlugins={remarkPlugins}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default AnimatedMarkdown;
