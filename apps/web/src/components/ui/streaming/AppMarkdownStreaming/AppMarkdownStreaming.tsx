'use client';

import React from 'react';
import { cn } from '@/lib/classMerge';
import type {
  MarkdownAnimation,
  MarkdownAnimationTimingFunction
} from '../../typography/animation-common';
import AnimatedMarkdown from '../../typography/AnimatedMarkdown/AnimatedMarkdown';
import { useLLMStreaming } from './useLLMStreaming';

interface AppMarkdownStreamingProps {
  content: string;
  isStreamFinished: boolean;
  animation?: MarkdownAnimation;
  animationDuration?: number;
  animationTimingFunction?: MarkdownAnimationTimingFunction;
  className?: string;
  stripFormatting?: boolean;
}

const AppMarkdownStreaming = ({
  content,
  isStreamFinished,
  animation = 'blurIn',
  animationDuration = 300,
  animationTimingFunction = 'linear',
  className,
  stripFormatting = true
}: AppMarkdownStreamingProps) => {
  const { throttledContent } = useLLMStreaming({ content, isStreamFinished });

  return (
    <div className={cn('flex flex-col space-y-2.5', className)}>
      <AnimatedMarkdown
        content={throttledContent}
        isStreamFinished={isStreamFinished}
        animation={animation}
        animationDuration={animationDuration}
        animationTimingFunction={animationTimingFunction}
        stripFormatting={stripFormatting}
      />
    </div>
  );
  //     animationDuration={animationDuration}
};

export default AppMarkdownStreaming;
