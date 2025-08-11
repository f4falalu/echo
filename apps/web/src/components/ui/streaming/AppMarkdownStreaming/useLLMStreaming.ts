import * as React from 'react';

export type UseLLMStreamingProps = {
  // Full upstream content accumulated so far
  content: string;
  // Whether upstream stream has ended
  isStreamFinished: boolean;
  // Number of characters we want buffered beyond the emitted chunk before flushing
  targetBufferChars?: number;
  // Minimum characters to emit per frame
  minChunkChars?: number;
  // Maximum characters to emit per frame
  maxChunkChars?: number;
  // Preferred frame pacing (ms) to gate re-renders; 33ms ≈ 30fps
  frameLookBackMs?: number;
  // Percentage [0..1] to scale chunk size based on recent input growth
  adjustPercentage?: number;
  // Hold back a few characters to ensure correct markdown rendering
  readAheadChars?: number;
  // Maximum time to wait for read-ahead before forcing a flush
  readAheadMaxMs?: number;
  // If true, apply simple markdown-aware boundaries (inline code/backticks)
  markdownSafeBoundaries?: boolean;
  // Do not delay beyond this total lag when stream has finished; flush all
  flushImmediatelyOnComplete?: boolean;
};

export type UseLLMStreamingReturn = {
  throttledContent: string;
  isDone: boolean;
  flushNow: () => void;
  reset: () => void;
};

// Compute a safe chunk length given backlog and configuration
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

// Count number of triple-backtick fences in a substring
function countFencesIn(text: string): number {
  const fenceRegex = /```/g;
  let count = 0;
  while (fenceRegex.exec(text) !== null) count++;
  return count;
}

// Count isolated single backticks (not part of fences) in a small chunk
function countIsolatedBackticks(text: string): number {
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '`' && text[i - 1] !== '`' && text[i + 1] !== '`') {
      count++;
    }
  }
  return count;
}

// Find first isolated single backtick index in a small chunk
function findFirstIsolatedBacktickIndex(text: string): number {
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '`' && text[i - 1] !== '`' && text[i + 1] !== '`') {
      return i;
    }
  }
  return -1;
}

function findNextIsolatedBacktickIndexFrom(text: string, startIndex: number): number {
  for (let i = startIndex; i < text.length; i++) {
    if (text[i] === '`' && text[i - 1] !== '`' && text[i + 1] !== '`') {
      return i;
    }
  }
  return -1;
}

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreamFinished, content]);

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
