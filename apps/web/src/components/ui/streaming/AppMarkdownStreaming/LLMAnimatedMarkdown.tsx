import type { BlockMatch } from '@llm-ui/react';
import AnimatedMarkdown from '../../typography/AnimatedMarkdown/AnimatedMarkdown';
import React, { useMemo } from 'react';
import { useAppMarkdownStreaming } from './AppMarkdownStreaming';
import { findPartialInlineCode } from './inlineCodeHelpers';

type LLMAnimatedMarkdownProps = {
  blockMatch: BlockMatch;
};

export const LLMAnimatedMarkdown: React.FC<LLMAnimatedMarkdownProps> = React.memo(
  ({ blockMatch }) => {
    const markdown = blockMatch.output;
    const {
      animation,
      stripFormatting,
      animationDuration,
      isStreamFinished,
      animationTimingFunction
    } = useAppMarkdownStreaming();

    const optimizedContent = useMemo(() => {
      const partialMatch = findPartialInlineCode(markdown);

      // If there's a partial inline code match, only show content up to the start of the partial match
      // This naturally excludes the offending backtick without affecting complete inline code blocks
      if (partialMatch) {
        return markdown.slice(0, partialMatch.startIndex);
      }

      // No partial match, show all content as-is
      return markdown;
    }, [markdown]);

    return (
      <AnimatedMarkdown
        content={optimizedContent}
        isStreamFinished={isStreamFinished && blockMatch.isComplete}
        animation={animation}
        animationDuration={animationDuration}
        animationTimingFunction={animationTimingFunction}
        stripFormatting={stripFormatting}
      />
    );
  }
);

LLMAnimatedMarkdown.displayName = 'LLMAnimatedMarkdown';

export default LLMAnimatedMarkdown;
