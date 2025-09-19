import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRetryableStep, runStepsWithRetry, withStepRetry } from './with-step-retry';

describe('with-step-retry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('withStepRetry', () => {
    it('should execute successfully on first attempt', async () => {
      const mockStep = vi.fn().mockResolvedValue('success');

      const result = await withStepRetry(mockStep, {
        stepName: 'test-step',
        maxAttempts: 3,
        baseDelayMs: 10,
      });

      expect(result).toBe('success');
      expect(mockStep).toHaveBeenCalledTimes(1);
    });

    it('should retry on error and succeed on second attempt', async () => {
      const mockStep = vi
        .fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce('success');

      const onRetry = vi.fn();

      const result = await withStepRetry(mockStep, {
        stepName: 'test-step',
        maxAttempts: 3,
        baseDelayMs: 10,
        onRetry,
      });

      expect(result).toBe('success');
      expect(mockStep).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    });

    it('should fail after max attempts', async () => {
      const error = new Error('Persistent failure');
      const mockStep = vi.fn().mockRejectedValue(error);
      const onRetry = vi.fn();

      await expect(
        withStepRetry(mockStep, {
          stepName: 'test-step',
          maxAttempts: 3,
          baseDelayMs: 10,
          onRetry,
        })
      ).rejects.toThrow('Persistent failure');

      expect(mockStep).toHaveBeenCalledTimes(3);
      expect(onRetry).toHaveBeenCalledTimes(2); // Called on retry attempts 1 and 2, not on final failure
    });

    it('should use exponential backoff for delays', async () => {
      const mockStep = vi
        .fn()
        .mockRejectedValueOnce(new Error('Failure 1'))
        .mockRejectedValueOnce(new Error('Failure 2'))
        .mockResolvedValueOnce('success');

      const onRetry = vi.fn();
      const startTime = Date.now();

      const result = await withStepRetry(mockStep, {
        stepName: 'test-step',
        maxAttempts: 3,
        baseDelayMs: 10,
        onRetry,
      });

      const duration = Date.now() - startTime;
      // Should take at least 10ms (first retry) + 20ms (second retry) = 30ms
      expect(duration).toBeGreaterThanOrEqual(30);
      expect(result).toBe('success');
      expect(mockStep).toHaveBeenCalledTimes(3);
    });

    it('should handle non-Error objects', async () => {
      const mockStep = vi
        .fn()
        .mockRejectedValueOnce('string error')
        .mockResolvedValueOnce('success');

      const onRetry = vi.fn();

      const result = await withStepRetry(mockStep, {
        stepName: 'test-step',
        maxAttempts: 2,
        baseDelayMs: 10,
        onRetry,
      });

      expect(result).toBe('success');
      expect(onRetry).toHaveBeenCalledWith(1, 'string error');
    });

    it('should handle undefined errors', async () => {
      const mockStep = vi.fn().mockRejectedValueOnce(undefined).mockResolvedValueOnce('success');

      const result = await withStepRetry(mockStep, {
        stepName: 'test-step',
        maxAttempts: 2,
        baseDelayMs: 10,
      });

      expect(result).toBe('success');
      expect(mockStep).toHaveBeenCalledTimes(2);
    });
  });

  describe('createRetryableStep', () => {
    it('should create a retryable function', async () => {
      const originalFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Failure'))
        .mockResolvedValueOnce('success');

      const retryableFn = createRetryableStep(originalFn, {
        stepName: 'retryable-step',
        maxAttempts: 2,
        baseDelayMs: 10,
      });

      const result = await retryableFn();

      expect(result).toBe('success');
      expect(originalFn).toHaveBeenCalledTimes(2);
    });

    it('should pass arguments correctly', async () => {
      const originalFn = vi.fn((a: string, b: number) => Promise.resolve(`${a}-${b}`));

      const retryableFn = createRetryableStep(originalFn, {
        stepName: 'retryable-step',
        maxAttempts: 1,
        baseDelayMs: 10,
      });

      const result = await retryableFn('test', 123);

      expect(result).toBe('test-123');
      expect(originalFn).toHaveBeenCalledWith('test', 123);
    });
  });

  describe('runStepsWithRetry', () => {
    it('should run multiple steps in parallel', async () => {
      const step1 = vi.fn().mockResolvedValue('result1');
      const step2 = vi.fn().mockResolvedValue('result2');
      const step3 = vi.fn().mockResolvedValue('result3');

      const results = await runStepsWithRetry([
        { stepFn: step1, options: { stepName: 'step1', maxAttempts: 3, baseDelayMs: 10 } },
        { stepFn: step2, options: { stepName: 'step2', maxAttempts: 3, baseDelayMs: 10 } },
        { stepFn: step3, options: { stepName: 'step3', maxAttempts: 3, baseDelayMs: 10 } },
      ]);

      expect(results).toEqual(['result1', 'result2', 'result3']);
      expect(step1).toHaveBeenCalledTimes(1);
      expect(step2).toHaveBeenCalledTimes(1);
      expect(step3).toHaveBeenCalledTimes(1);
    });

    it('should retry individual steps independently', async () => {
      const step1 = vi
        .fn()
        .mockRejectedValueOnce(new Error('Failure'))
        .mockResolvedValueOnce('result1');
      const step2 = vi.fn().mockResolvedValue('result2');
      const step3 = vi
        .fn()
        .mockRejectedValueOnce(new Error('Failure'))
        .mockResolvedValueOnce('result3');

      const results = await runStepsWithRetry([
        { stepFn: step1, options: { stepName: 'step1', maxAttempts: 2, baseDelayMs: 10 } },
        { stepFn: step2, options: { stepName: 'step2', maxAttempts: 2, baseDelayMs: 10 } },
        { stepFn: step3, options: { stepName: 'step3', maxAttempts: 2, baseDelayMs: 10 } },
      ]);

      expect(results).toEqual(['result1', 'result2', 'result3']);
      expect(step1).toHaveBeenCalledTimes(2); // Failed once, then succeeded
      expect(step2).toHaveBeenCalledTimes(1); // Succeeded immediately
      expect(step3).toHaveBeenCalledTimes(2); // Failed once, then succeeded
    });

    it('should fail if any step fails after max attempts', async () => {
      const step1 = vi.fn().mockResolvedValue('result1');
      const step2 = vi.fn().mockRejectedValue(new Error('Persistent failure'));
      const step3 = vi.fn().mockResolvedValue('result3');

      await expect(
        runStepsWithRetry([
          { stepFn: step1, options: { stepName: 'step1', maxAttempts: 2, baseDelayMs: 10 } },
          { stepFn: step2, options: { stepName: 'step2', maxAttempts: 2, baseDelayMs: 10 } },
          { stepFn: step3, options: { stepName: 'step3', maxAttempts: 2, baseDelayMs: 10 } },
        ])
      ).rejects.toThrow('Persistent failure');

      expect(step1).toHaveBeenCalledTimes(1);
      expect(step2).toHaveBeenCalledTimes(2); // Tried max attempts
      expect(step3).toHaveBeenCalledTimes(1);
    });
  });
});
