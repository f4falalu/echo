'use client';

import { cn } from '@/lib/classMerge';
import AnimatedMarkdown from '../../typography/AnimatedMarkdown/AnimatedMarkdown';
import type {
  MarkdownAnimation,
  MarkdownAnimationTimingFunction,
} from '../../typography/animation-common';
import { useLLMStreaming } from './useLLMStreaming';

/**
 * Props for {@link AppMarkdownStreaming}.
 *
 * @property content - The full markdown content accumulated so far from the upstream stream.
 * @property isStreamFinished - Whether the upstream stream has finished producing content.
 * @property animation - Name of the entrance animation to apply to the rendered markdown. Defaults to `"blurIn"`.
 * @property animationDuration - Duration in milliseconds for the animation. Defaults to `300`.
 * @property animationTimingFunction - Timing function for the animation. Defaults to `"linear"`.
 * @property className - Optional class name(s) applied to the outer container.
 * @property stripFormatting - If true, removes formatting artifacts for cleaner display during streaming. Defaults to `true`.
 */
interface AppMarkdownStreamingProps {
  content: string;
  isStreamFinished: boolean;
  animation?: MarkdownAnimation;
  animationDuration?: number;
  animationTimingFunction?: MarkdownAnimationTimingFunction;
  className?: string;
  stripFormatting?: boolean;
}

/**
 * AppMarkdownStreaming
 *
 * A lightweight wrapper that renders progressively streamed markdown with
 * smooth frame-paced updates. It uses `useLLMStreaming` to throttle incoming
 * content for reduced re-render thrash and passes the result to
 * `AnimatedMarkdown` for presentation.
 *
 * @remarks
 * - Provide the full accumulated `content` string as it grows; the hook will
 *   compute and render an appropriate visible subset on each animation frame.
 * - When `isStreamFinished` becomes true, the remainder is flushed (subject to
 *   the hook configuration) so the UI settles quickly.
 *
 * @param props - {@link AppMarkdownStreamingProps}
 *
 * @example
 * ```tsx
 * <AppMarkdownStreaming
 *   content={streamedMarkdown}
 *   isStreamFinished={done}
 *   animation="blurIn"
 *   animationDuration={300}
 * />
 * ```
 */
const AppMarkdownStreaming = ({
  content,
  isStreamFinished,
  animation = 'blurIn',
  animationDuration = 300,
  animationTimingFunction = 'linear',
  className,
  stripFormatting = true,
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
};

export default AppMarkdownStreaming;
