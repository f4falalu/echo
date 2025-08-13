import * as React from 'react';

/**
 * Configuration for a single token in the stream.
 */
export type StreamToken = {
  /** The text content of this token */
  token: string;
  /** Delay in milliseconds before this token is emitted */
  delayMs: number;
};

/**
 * Configuration for {@link useStreamTokenArray}.
 *
 * Supply the full array of `tokens` as it grows over time. The hook will emit
 * a progressively revealed subset to create a smooth streaming effect with
 * configurable pacing and token grouping.
 */
export type UseStreamTokenArrayProps = {
  /**
   * Full upstream token array accumulated so far. Provide the entire array as it
   * grows; the hook determines what subset to show.
   */
  tokens: StreamToken[];
  /** Whether upstream stream has ended. Drives final flushing behavior. */
  isStreamFinished: boolean;
  /**
   * Number of tokens to keep buffered beyond the emitted tokens before
   * flushing. Higher values increase perceived smoothness at the cost of
   * latency.
   * @defaultValue 3
   */
  targetBufferTokens?: number;
  /**
   * Minimum tokens to emit per frame.
   * @defaultValue 1
   */
  minChunkTokens?: number;
  /**
   * Maximum tokens to emit per frame.
   * @defaultValue 5
   */
  maxChunkTokens?: number;
  /**
   * Preferred frame pacing in milliseconds used to gate re-renders (100ms ≈ 10fps).
   * @defaultValue 100
   */
  frameLookBackMs?: number;
  /**
   * Percentage in [0..1] used to scale chunk size based on recent token growth.
   * @defaultValue 0.5
   */
  adjustPercentage?: number;
  /**
   * If true, do not delay beyond the configured gating once the stream has
   * finished; flush the remainder immediately.
   * @defaultValue true
   */
  flushImmediatelyOnComplete?: boolean;
  /**
   * Custom separator to join tokens when returning as string.
   * @defaultValue ' '
   */
  tokenSeparator?: string;
};

/**
 * Return value of {@link useStreamTokenArray}.
 */
export type UseStreamTokenArrayReturn = {
  /** The currently visible, throttled subset of the upstream tokens as an array. */
  throttledTokens: StreamToken[];
  /** The currently visible, throttled subset joined as a string. */
  throttledContent: string;
  /** True when `isStreamFinished` is true and all tokens have been emitted. */
  isDone: boolean;
  /** Immediately reveal all available upstream tokens. */
  flushNow: () => void;
  /** Reset internal state and visible tokens back to empty. */
  reset: () => void;
};

/**
 * Compute an emission chunk length given backlog and configuration.
 *
 * The result respects min/max chunk sizes and is increased proportionally
 * to recent upstream growth to keep up with fast producers.
 *
 * @param backlogLength - Tokens remaining to be emitted.
 * @param recentDelta - Increase in source token count since the last pacing window.
 * @param cfg - Required emission configuration bounds and growth scaling.
 * @returns A safe chunk size to emit on this frame.
 */
function computeTokenChunkLength(
  backlogLength: number,
  recentDelta: number,
  cfg: Required<
    Pick<
      UseStreamTokenArrayProps,
      'minChunkTokens' | 'maxChunkTokens' | 'targetBufferTokens' | 'adjustPercentage'
    >
  >
): number {
  // Aim to leave targetBufferTokens un-emitted
  const desired = Math.max(0, backlogLength - cfg.targetBufferTokens);
  // React to recent growth: if backlog grew, increase the chunk size a bit
  const growthBoost = recentDelta > 0 ? Math.floor(recentDelta * cfg.adjustPercentage) : 0;
  const candidate = desired + growthBoost;
  return Math.max(cfg.minChunkTokens, Math.min(cfg.maxChunkTokens, candidate));
}

/**
 * useStreamTokenArray
 *
 * React hook that progressively reveals an upstream array of tokens with frame-paced
 * updates. It aims to balance responsiveness and readability by controlling the size
 * and timing of emitted token chunks, creating a smooth streaming effect for
 * word-by-word or sentence-by-sentence content delivery.
 *
 * @remarks
 * - Provide the full accumulated `tokens` array as it grows over time.
 * - When `isStreamFinished` becomes true, the hook can flush the remaining
 *   tokens immediately (configurable via `flushImmediatelyOnComplete`).
 * - Use `flushNow` to reveal everything eagerly; use `reset` to clear state for
 *   a new stream.
 * - Returns both the token array and joined string for flexibility.
 *
 * @param props - {@link UseStreamTokenArrayProps}
 * @returns {@link UseStreamTokenArrayReturn}
 *
 * @example
 * ```tsx
 * const { throttledTokens, throttledContent, isDone, flushNow, reset } = useStreamTokenArray({
 *   tokens: [
 *     { token: 'Hello', delayMs: 100 },
 *     { token: 'world', delayMs: 200 },
 *     { token: 'from', delayMs: 150 },
 *     { token: 'streaming', delayMs: 300 },
 *     { token: 'tokens', delayMs: 250 }
 *   ],
 *   isStreamFinished: false
 * });
 * ```
 */
export const useStreamTokenArray = ({
  tokens,
  isStreamFinished,
  targetBufferTokens = 3,
  minChunkTokens = 1,
  maxChunkTokens = 5,
  frameLookBackMs = 100,
  adjustPercentage = 0.5,
  flushImmediatelyOnComplete = true,
  tokenSeparator = ' '
}: UseStreamTokenArrayProps): UseStreamTokenArrayReturn => {
  const [throttledTokens, setThrottledTokens] = React.useState<StreamToken[]>([]);

  // Refs to avoid re-renders
  const shownTokenCountRef = React.useRef<number>(0);
  const lastUpdateTsRef = React.useRef<number>(0);
  const rafIdRef = React.useRef<number | null>(null);
  const prevSourceLenRef = React.useRef<number>(0);
  const prevSourceTsRef = React.useRef<number>(0);

  // Keep latest tokens and finished flag in refs so RAF loop does not need to re-subscribe
  const tokensRef = React.useRef<StreamToken[]>(tokens);
  const finishedRef = React.useRef<boolean>(isStreamFinished);

  React.useEffect(() => {
    tokensRef.current = tokens;
  }, [tokens]);

  React.useEffect(() => {
    finishedRef.current = isStreamFinished;
  }, [isStreamFinished]);

  // Keep refs in sync with state
  React.useEffect(() => {
    shownTokenCountRef.current = throttledTokens.length;
  }, [throttledTokens.length]);

  // Flush immediately if the stream has finished and we want no lag
  React.useEffect(() => {
    if (isStreamFinished && flushImmediatelyOnComplete) {
      if (throttledTokens.length !== tokens.length) {
        setThrottledTokens([...tokens]);
        shownTokenCountRef.current = tokens.length;
      }
    }
  }, [isStreamFinished, tokens, flushImmediatelyOnComplete, throttledTokens.length]);

  const flushNow = React.useCallback(() => {
    setThrottledTokens([...tokens]);
    shownTokenCountRef.current = tokens.length;
  }, [tokens]);

  const reset = React.useCallback(() => {
    setThrottledTokens([]);
    shownTokenCountRef.current = 0;
    lastUpdateTsRef.current = 0;
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

      const shownTokenCount = shownTokenCountRef.current;
      const sourceTokenCount = tokensRef.current.length;
      const backlogTokenCount = Math.max(0, sourceTokenCount - shownTokenCount);

      // Defensive sync: if upstream tokens shrink (e.g., reset without calling `reset()`),
      // align the visible tokens to avoid a persistent RAF loop with zero backlog.
      if (shownTokenCount > sourceTokenCount && shouldTick) {
        setThrottledTokens([...tokensRef.current]);
        shownTokenCountRef.current = sourceTokenCount;
        lastUpdateTsRef.current = now;
      }

      // Track input growth to adapt chunk size
      const prevLen = prevSourceLenRef.current;
      const prevTs = prevSourceTsRef.current || now;
      const recentDelta = sourceTokenCount - prevLen;
      if (now - prevTs >= frameLookBackMs) {
        prevSourceLenRef.current = sourceTokenCount;
        prevSourceTsRef.current = now;
      }

      if (shouldTick && backlogTokenCount > 0) {
        // Base chunk length based on backlog and recent growth
        let chunkTokenCount = computeTokenChunkLength(backlogTokenCount, recentDelta, {
          minChunkTokens,
          maxChunkTokens,
          targetBufferTokens,
          adjustPercentage
        });

        // Ensure chunk does not exceed backlog
        if (chunkTokenCount > backlogTokenCount) {
          chunkTokenCount = backlogTokenCount;
        }

        // Emit the chunk
        const newTokenCount = shownTokenCount + chunkTokenCount;
        const newThrottledTokens = tokensRef.current.slice(0, newTokenCount);

        setThrottledTokens(newThrottledTokens);
        shownTokenCountRef.current = newTokenCount;
        lastUpdateTsRef.current = now;
      }

      // Schedule next frame if we still expect updates
      const shouldContinue =
        mounted &&
        (tokensRef.current.length !== shownTokenCountRef.current || !finishedRef.current);
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
  }, [adjustPercentage, frameLookBackMs, maxChunkTokens, minChunkTokens, targetBufferTokens]);

  const isDone = isStreamFinished && throttledTokens.length >= tokens.length;

  // When totally done, clear internal gating state to release references and be ready for next run
  React.useEffect(() => {
    if (!isDone) return;
    // Clear timers and internal caches (do not touch visible content)
    prevSourceLenRef.current = 0;
    prevSourceTsRef.current = 0;
    // Drop lastUpdate tick so next stream starts fresh
    lastUpdateTsRef.current = 0;
  }, [isDone]);

  // Join tokens to create content string
  const throttledContent = React.useMemo(() => {
    return throttledTokens.map((t) => t.token).join(tokenSeparator);
  }, [throttledTokens, tokenSeparator]);

  return {
    throttledTokens,
    throttledContent,
    isDone,
    flushNow,
    reset
  };
};
