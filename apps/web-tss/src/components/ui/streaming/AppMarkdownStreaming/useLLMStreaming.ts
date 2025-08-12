import * as React from 'react';

/**
 * Configuration for {@link useLLMStreaming}.
 *
 * Supply the full, accumulated `content` string as it grows over time. The
 * hook will emit a progressively revealed substring to reduce re-render
 * pressure while maintaining markdown-aware safety around backticks and code
 * fences.
 */
export type UseLLMStreamingProps = {
  /**
   * Full upstream content accumulated so far. Provide the entire string as it
   * grows; the hook determines what subset to show.
   */
  content: string;
  /** Whether upstream stream has ended. Drives final flushing behavior. */
  isStreamFinished: boolean;
  /**
   * Number of characters to keep buffered beyond the emitted chunk before
   * flushing. Higher values increase perceived smoothness at the cost of
   * latency.
   * @defaultValue 21
   */
  targetBufferChars?: number;
  /**
   * Minimum characters to emit per frame.
   * @defaultValue 4
   */
  minChunkChars?: number;
  /**
   * Maximum characters to emit per frame.
   * @defaultValue 45
   */
  maxChunkChars?: number;
  /**
   * Preferred frame pacing in milliseconds used to gate re-renders (33ms ≈ 30fps).
   * @defaultValue 33
   */
  frameLookBackMs?: number;
  /**
   * Percentage in [0..1] used to scale chunk size based on recent input growth.
   * @defaultValue 0.35
   */
  adjustPercentage?: number;
  /**
   * Read-ahead characters required beyond the next chunk to avoid rendering
   * partial tokens that could break markdown.
   * @defaultValue 6
   */
  readAheadChars?: number;
  /**
   * Maximum time to wait for read-ahead before forcing a flush.
   * @defaultValue 200
   */
  readAheadMaxMs?: number;
  /**
   * If true, apply markdown-aware boundaries to avoid starting inline or fenced
   * code blocks without also rendering their closers when possible.
   * @defaultValue true
   */
  markdownSafeBoundaries?: boolean;
  /**
   * If true, do not delay beyond the configured gating once the stream has
   * finished; flush the remainder immediately.
   * @defaultValue true
   */
  flushImmediatelyOnComplete?: boolean;
};

/**
 * Return value of {@link useLLMStreaming}.
 */
export type UseLLMStreamingReturn = {
  /** The currently visible, throttled subset of the upstream `content`. */
  throttledContent: string;
  /** True when `isStreamFinished` is true and all characters have been emitted. */
  isDone: boolean;
  /** Immediately reveal all available upstream `content`. */
  flushNow: () => void;
  /** Reset internal state and visible content back to empty. */
  reset: () => void;
};

/**
 * Compute an emission chunk length given backlog and configuration.
 *
 * The result respects min/max chunk sizes and is increased proportionally
 * to recent upstream growth to keep up with fast producers.
 *
 * @param backlogLength - Characters remaining to be emitted.
 * @param recentDelta - Increase in source length since the last pacing window.
 * @param cfg - Required emission configuration bounds and growth scaling.
 * @returns A safe chunk size to emit on this frame.
 */
function computeChunkLength(
  backlogLength: number,
  recentDelta: number,
  cfg: Required<
    Pick<
      UseLLMStreamingProps,
      'minChunkChars' | 'maxChunkChars' | 'targetBufferChars' | 'adjustPercentage'
    >
  >
): number {
  // Aim to leave targetBufferChars un-emitted
  const desired = Math.max(0, backlogLength - cfg.targetBufferChars);
  // React to recent growth: if backlog grew, increase the chunk size a bit
  const growthBoost = recentDelta > 0 ? Math.floor(recentDelta * cfg.adjustPercentage) : 0;
  const candidate = desired + growthBoost;
  return Math.max(cfg.minChunkChars, Math.min(cfg.maxChunkChars, candidate));
}

/**
 * Count the number of triple-backtick code-fence tokens (```)
 * present in the provided text.
 *
 * @param text - Substring to inspect.
 * @returns Count of fence tokens.
 */
function countFencesIn(text: string): number {
  const fenceRegex = /```/g;
  let count = 0;
  while (fenceRegex.exec(text) !== null) count++;
  return count;
}

/**
 * Count isolated single backticks (not part of a fence) in the given text.
 * A backtick is considered isolated if neither neighbor is a backtick.
 *
 * @param text - Substring to inspect.
 * @returns Count of isolated backticks.
 */
function countIsolatedBackticks(text: string): number {
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '`' && text[i - 1] !== '`' && text[i + 1] !== '`') {
      count++;
    }
  }
  return count;
}

/**
 * Find the index of the first isolated single backtick in the given text.
 * Returns -1 if none exist.
 *
 * @param text - Substring to inspect.
 * @returns Index of the first isolated backtick, or -1.
 */
function findFirstIsolatedBacktickIndex(text: string): number {
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '`' && text[i - 1] !== '`' && text[i + 1] !== '`') {
      return i;
    }
  }
  return -1;
}

/**
 * Find the next isolated backtick index in `text` starting from `startIndex`.
 * Returns -1 if none exist.
 *
 * @param text - Substring to inspect.
 * @param startIndex - Starting offset to begin the search.
 * @returns Index of the next isolated backtick, or -1.
 */
function findNextIsolatedBacktickIndexFrom(text: string, startIndex: number): number {
  for (let i = startIndex; i < text.length; i++) {
    if (text[i] === '`' && text[i - 1] !== '`' && text[i + 1] !== '`') {
      return i;
    }
  }
  return -1;
}

/**
 * useLLMStreaming
 *
 * React hook that progressively reveals an upstream markdown `content` stream
 * with frame-paced updates. It aims to balance responsiveness and readability
 * by controlling the size and timing of emitted substrings, while avoiding
 * rendering partial inline code segments or unbalanced ``` fences when possible.
 *
 * @remarks
 * - Provide the full accumulated `content` string as it grows over time.
 * - When `isStreamFinished` becomes true, the hook can flush the remaining
 *   content immediately (configurable via `flushImmediatelyOnComplete`).
 * - Use `flushNow` to reveal everything eagerly; use `reset` to clear state for
 *   a new stream.
 *
 * @param props - {@link UseLLMStreamingProps}
 * @returns {@link UseLLMStreamingReturn}
 *
 * @example
 * ```tsx
 * const { throttledContent, isDone, flushNow, reset } = useLLMStreaming({
 *   content,
 *   isStreamFinished
 * });
 * ```
 */
export const useLLMStreaming = ({
  content,
  isStreamFinished,
  targetBufferChars = 21,
  minChunkChars = 4,
  maxChunkChars = 45,
  frameLookBackMs = 33,
  adjustPercentage = 0.35,
  readAheadChars = 6,
  readAheadMaxMs = 200,
  markdownSafeBoundaries = true,
  flushImmediatelyOnComplete = true
}: UseLLMStreamingProps): UseLLMStreamingReturn => {
  const [throttledContent, setThrottledContent] = React.useState<string>(content);

  // Refs to avoid re-renders
  const shownLengthRef = React.useRef<number>(0);
  const lastUpdateTsRef = React.useRef<number>(0);
  const rafIdRef = React.useRef<number | null>(null);
  const readAheadStartTsRef = React.useRef<number | null>(null);
  const prevSourceLenRef = React.useRef<number>(0);
  const prevSourceTsRef = React.useRef<number>(0);
  const fenceOpenRef = React.useRef<boolean>(false);
  const inlineOpenRef = React.useRef<boolean>(false);
  // Keep latest content and finished flag in refs so RAF loop does not need to re-subscribe
  const contentRef = React.useRef<string>(content);
  const finishedRef = React.useRef<boolean>(isStreamFinished);

  React.useEffect(() => {
    contentRef.current = content;
  }, [content]);

  React.useEffect(() => {
    finishedRef.current = isStreamFinished;
  }, [isStreamFinished]);

  // Keep refs in sync with state/props
  React.useEffect(() => {
    shownLengthRef.current = throttledContent.length;
  }, [throttledContent.length]);

  // Flush immediately if the stream has finished and we want no lag
  React.useEffect(() => {
    if (isStreamFinished && flushImmediatelyOnComplete) {
      if (throttledContent.length !== content.length) {
        setThrottledContent(content);
        shownLengthRef.current = content.length;
      }
    }
  }, [isStreamFinished, content, flushImmediatelyOnComplete, throttledContent.length]);

  const flushNow = React.useCallback(() => {
    setThrottledContent(content);
    shownLengthRef.current = content.length;
    readAheadStartTsRef.current = null;
  }, [content]);

  const reset = React.useCallback(() => {
    setThrottledContent('');
    shownLengthRef.current = 0;
    lastUpdateTsRef.current = 0;
    readAheadStartTsRef.current = null;
    prevSourceLenRef.current = 0;
    prevSourceTsRef.current = 0;
    fenceOpenRef.current = false;
    inlineOpenRef.current = false;
  }, []);

  // Main animation frame loop
  React.useEffect(() => {
    let mounted = true;

    function loop(now: number) {
      if (!mounted) return;

      const lastUpdate = lastUpdateTsRef.current;
      const shouldTick = now - lastUpdate >= frameLookBackMs;

      const shownLen = shownLengthRef.current;
      const sourceLen = contentRef.current.length;
      const backlogLen = Math.max(0, sourceLen - shownLen);

      // Defensive sync: if upstream content shrinks (e.g., reset without calling `reset()`),
      // align the visible content to avoid a persistent RAF loop with zero backlog.
      if (shownLen > sourceLen && shouldTick) {
        setThrottledContent(contentRef.current);
        shownLengthRef.current = sourceLen;
        lastUpdateTsRef.current = now;
      }

      // Track input growth to adapt chunk size
      const prevLen = prevSourceLenRef.current;
      const prevTs = prevSourceTsRef.current || now;
      const recentDelta = sourceLen - prevLen;
      if (now - prevTs >= frameLookBackMs) {
        prevSourceLenRef.current = sourceLen;
        prevSourceTsRef.current = now;
      }

      if (shouldTick && backlogLen > 0) {
        // Base chunk length based on backlog and recent growth
        let chunkLen = computeChunkLength(backlogLen, recentDelta, {
          minChunkChars: minChunkChars,
          maxChunkChars: maxChunkChars,
          targetBufferChars: targetBufferChars,
          adjustPercentage: adjustPercentage
        });

        // Ensure chunk does not exceed backlog
        if (chunkLen > backlogLen) chunkLen = backlogLen;

        const src = contentRef.current;

        // Optional inline-code boundary snapping: avoid starting an inline code without end
        let inlineStartLocalIdx = -1;
        if (markdownSafeBoundaries && chunkLen > 0 && inlineOpenRef.current === false) {
          const tentativeChunk = src.slice(shownLen, shownLen + chunkLen);
          const firstTickIdx = findFirstIsolatedBacktickIndex(tentativeChunk);
          if (firstTickIdx !== -1) {
            inlineStartLocalIdx = firstTickIdx;
            // If we would start an inline block within this chunk and cannot also close it
            // in the same chunk, snap to emit only content before the tick.
            const ticksInChunk = countIsolatedBackticks(tentativeChunk);
            const closesWithinChunk = ticksInChunk >= 2 && ticksInChunk % 2 === 0;
            if (!closesWithinChunk) {
              const snappedLen = Math.max(0, firstTickIdx);
              if (snappedLen < chunkLen) {
                chunkLen = snappedLen;
              }
            }
          }
        }

        // Recompute nextChunk and totals after possible snapping
        const nextChunk = src.slice(shownLen, shownLen + chunkLen);
        const totalAfterEmit = src.slice(0, shownLen + chunkLen);

        // If snapping resulted in zero-length progress, we must not emit immediately
        const zeroProgressBlocked = chunkLen === 0;

        // Read-ahead gating using possibly-adjusted chunkLen
        const haveLookahead = !zeroProgressBlocked && backlogLen >= chunkLen + readAheadChars;

        // Markdown-aware safety: predict fenced-code and inline-code state after emit via parity
        let markdownGate = false;
        if (markdownSafeBoundaries) {
          // Inline code: compute next inline-open state using isolated backtick parity in this chunk
          const ticksInChunk = countIsolatedBackticks(nextChunk);
          const nextInlineOpen =
            ticksInChunk % 2 === 1 ? !inlineOpenRef.current : inlineOpenRef.current;
          if (nextInlineOpen) markdownGate = true;
          // Fenced code blocks (```): parity update using only the chunk
          const fenceCountInChunk = countFencesIn(nextChunk);
          const nextFenceOpen = fenceOpenRef.current
            ? fenceCountInChunk % 2 === 0
            : fenceCountInChunk % 2 === 1;
          if (!markdownGate && nextFenceOpen) markdownGate = true;
        }

        if (haveLookahead && !markdownGate) {
          // Safe to emit now
          setThrottledContent(totalAfterEmit);
          shownLengthRef.current = shownLen + chunkLen;
          lastUpdateTsRef.current = now;
          // Update fenced-code parity
          if (markdownSafeBoundaries) {
            const fenceCountInChunk = countFencesIn(nextChunk);
            if (fenceCountInChunk % 2 === 1) fenceOpenRef.current = !fenceOpenRef.current;
            const ticksInChunk = countIsolatedBackticks(nextChunk);
            if (ticksInChunk % 2 === 1) inlineOpenRef.current = !inlineOpenRef.current;
          }
          readAheadStartTsRef.current = null;
        } else {
          // Start or check read-ahead timer
          if (readAheadStartTsRef.current == null) {
            readAheadStartTsRef.current = now;
          }
          const waitedMs = now - (readAheadStartTsRef.current ?? now);
          const maxWaitReached = waitedMs >= readAheadMaxMs;

          if (maxWaitReached) {
            // If we were blocked by an inline-start snap that reduced chunk to 0, bypass snapping now
            if (chunkLen === 0 && inlineStartLocalIdx !== -1 && inlineOpenRef.current === false) {
              // Try to accelerate: search entire backlog for the closing backtick and emit up to it
              const globalInlineStart = shownLen + inlineStartLocalIdx;
              const closeIdx = findNextIsolatedBacktickIndexFrom(src, globalInlineStart + 1);
              if (closeIdx !== -1 && closeIdx >= shownLen) {
                const forcedLen = closeIdx - shownLen + 1; // include closing backtick
                const forcedNext = src.slice(shownLen, shownLen + forcedLen);
                const forcedTotal = src.slice(0, shownLen + forcedLen);
                setThrottledContent(forcedTotal);
                shownLengthRef.current = shownLen + forcedLen;
                lastUpdateTsRef.current = now;
                if (markdownSafeBoundaries) {
                  const fenceCountInForced = countFencesIn(forcedNext);
                  if (fenceCountInForced % 2 === 1) fenceOpenRef.current = !fenceOpenRef.current;
                  const ticksInForced = countIsolatedBackticks(forcedNext);
                  if (ticksInForced % 2 === 1) inlineOpenRef.current = !inlineOpenRef.current;
                }
                readAheadStartTsRef.current = null;
              } else {
                // No closing backtick yet; continue holding back rather than emitting a partial inline code
                // Do not reset readAheadStartTsRef so we keep checking quickly on new input
              }
            } else {
              // Force emit to avoid stalling
              setThrottledContent(totalAfterEmit);
              shownLengthRef.current = shownLen + chunkLen;
              lastUpdateTsRef.current = now;
              if (markdownSafeBoundaries) {
                const fenceCountInChunk = countFencesIn(nextChunk);
                if (fenceCountInChunk % 2 === 1) fenceOpenRef.current = !fenceOpenRef.current;
                const ticksInChunk = countIsolatedBackticks(nextChunk);
                if (ticksInChunk % 2 === 1) inlineOpenRef.current = !inlineOpenRef.current;
              }
              readAheadStartTsRef.current = null;
            }
          }
        }
      }

      // Schedule next frame if we still expect updates
      const shouldContinue =
        mounted && (contentRef.current.length !== shownLengthRef.current || !finishedRef.current);
      rafIdRef.current = shouldContinue ? window.requestAnimationFrame(loop) : null;
    }

    rafIdRef.current = window.requestAnimationFrame(loop);

    return () => {
      mounted = false;
      if (rafIdRef.current != null) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
    // Loop depends only on configuration, not on streaming values
  }, [
    adjustPercentage,
    frameLookBackMs,
    markdownSafeBoundaries,
    maxChunkChars,
    minChunkChars,
    readAheadChars,
    readAheadMaxMs,
    targetBufferChars
  ]);

  const isDone = isStreamFinished && throttledContent.length >= content.length;

  // When totally done, clear internal gating state to release references and be ready for next run
  React.useEffect(() => {
    if (!isDone) return;
    // Clear timers and internal caches (do not touch visible content)
    readAheadStartTsRef.current = null;
    prevSourceLenRef.current = 0;
    prevSourceTsRef.current = 0;
    fenceOpenRef.current = false;
    // Drop lastUpdate tick so next stream starts fresh
    lastUpdateTsRef.current = 0;
  }, [isDone]);

  return { throttledContent, isDone, flushNow, reset };
};
