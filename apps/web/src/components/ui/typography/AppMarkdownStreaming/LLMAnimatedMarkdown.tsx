import type { BlockMatch } from '@llm-ui/react';
import AnimatedMarkdown from '../AnimatedMarkdown/AnimatedMarkdown';
import React from 'react';
import { useAppMarkdownStreaming } from './AppMarkdownStreaming';

type LLMAnimatedMarkdownProps = {
  blockMatch: BlockMatch;
};

export const LLMAnimatedMarkdown: React.FC<LLMAnimatedMarkdownProps> = ({ blockMatch }) => {
  const markdown = blockMatch.output;
  const {
    animation,
    stripFormatting,
    isThrottleStreamingFinished,
    animationDuration,
    animationTimingFunction
  } = useAppMarkdownStreaming();

  return (
    <AnimatedMarkdown
      content={markdown}
      isStreamFinished={blockMatch.isComplete || isThrottleStreamingFinished}
      animation={animation}
      animationDuration={animationDuration}
      animationTimingFunction={animationTimingFunction}
      stripFormatting={stripFormatting}
    />
  );
};

export default LLMAnimatedMarkdown;
