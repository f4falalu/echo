import { describe, expect, test } from 'vitest';
import type { SequentialThinkingState } from '../sequential-thinking-tool';
import {
  createSequentialThinkingRawLlmMessageEntry,
  createSequentialThinkingReasoningMessage,
} from './sequential-thinking-tool-transform-helper';

describe('Sequential Thinking Tool Transform Helper', () => {
  describe('createSequentialThinkingReasoningMessage', () => {
    test('should create reasoning message with loading status by default', () => {
      const state: SequentialThinkingState = {
        entry_id: 'test-entry-123',
        args: undefined,
        thought: 'This is my thinking process',
        nextThoughtNeeded: true,
        thoughtNumber: 1,
      };

      const result = createSequentialThinkingReasoningMessage(state);

      expect(result).toEqual({
        id: 'test-entry-123',
        type: 'text',
        title: 'Thinking it through...',
        status: 'loading',
        message: 'This is my thinking process',
        message_chunk: undefined,
        secondary_title: undefined,
      });
    });

    test('should create reasoning message with completed status', () => {
      const state: SequentialThinkingState = {
        entry_id: 'test-entry-456',
        args: undefined,
        thought: 'Final thought completed',
        nextThoughtNeeded: false,
        thoughtNumber: 3,
      };

      const result = createSequentialThinkingReasoningMessage(state, undefined, 'completed');

      expect(result).toEqual({
        id: 'test-entry-456',
        type: 'text',
        title: 'Thought for a few seconds',
        status: 'completed',
        message: 'Final thought completed',
        message_chunk: undefined,
        secondary_title: undefined,
      });
    });

    test('should use toolCallId when entry_id is not set', () => {
      const state: SequentialThinkingState = {
        entry_id: undefined,
        args: undefined,
        thought: 'Thinking with toolCallId',
        nextThoughtNeeded: true,
        thoughtNumber: 1,
      };

      const result = createSequentialThinkingReasoningMessage(state, 'tool-call-789');

      expect(result).toEqual({
        id: 'tool-call-789',
        type: 'text',
        title: 'Thinking it through...',
        status: 'loading',
        message: 'Thinking with toolCallId',
        message_chunk: undefined,
        secondary_title: undefined,
      });
    });

    test('should return null when no id is available', () => {
      const state: SequentialThinkingState = {
        entry_id: undefined,
        args: undefined,
        thought: 'No ID available',
        nextThoughtNeeded: true,
        thoughtNumber: 1,
      };

      const result = createSequentialThinkingReasoningMessage(state);

      expect(result).toBeNull();
    });

    test('should handle empty thought', () => {
      const state: SequentialThinkingState = {
        entry_id: 'test-entry-empty',
        args: undefined,
        thought: undefined,
        nextThoughtNeeded: undefined,
        thoughtNumber: undefined,
      };

      const result = createSequentialThinkingReasoningMessage(state);

      expect(result).toEqual({
        id: 'test-entry-empty',
        type: 'text',
        title: 'Thinking it through...',
        status: 'loading',
        message: '',
        message_chunk: undefined,
        secondary_title: undefined,
      });
    });
  });

  describe('createSequentialThinkingRawLlmMessageEntry', () => {
    test('should create raw LLM message with all state values', () => {
      const state: SequentialThinkingState = {
        entry_id: 'test-entry-123',
        args: undefined,
        thought: 'Complete thinking process',
        nextThoughtNeeded: false,
        thoughtNumber: 5,
      };

      const result = createSequentialThinkingRawLlmMessageEntry(state);

      expect(result).toEqual({
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'test-entry-123',
            toolName: 'sequentialThinking',
            input: {
              thought: 'Complete thinking process',
              nextThoughtNeeded: false,
              thoughtNumber: 5,
            },
          },
        ],
      });
    });

    test('should create raw LLM message with partial state values', () => {
      const state: SequentialThinkingState = {
        entry_id: 'test-entry-456',
        args: undefined,
        thought: 'Partial thought',
        nextThoughtNeeded: undefined,
        thoughtNumber: undefined,
      };

      const result = createSequentialThinkingRawLlmMessageEntry(state);

      expect(result).toEqual({
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'test-entry-456',
            toolName: 'sequentialThinking',
            input: {
              thought: 'Partial thought',
            },
          },
        ],
      });
    });

    test('should use toolCallId when entry_id is not set', () => {
      const state: SequentialThinkingState = {
        entry_id: undefined,
        args: undefined,
        thought: 'Using toolCallId',
        nextThoughtNeeded: true,
        thoughtNumber: 2,
      };

      const result = createSequentialThinkingRawLlmMessageEntry(state, 'tool-call-999');

      expect(result).toEqual({
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'tool-call-999',
            toolName: 'sequentialThinking',
            input: {
              thought: 'Using toolCallId',
              nextThoughtNeeded: true,
              thoughtNumber: 2,
            },
          },
        ],
      });
    });

    test('should return null when no id is available', () => {
      const state: SequentialThinkingState = {
        entry_id: undefined,
        args: undefined,
        thought: 'No ID available',
        nextThoughtNeeded: true,
        thoughtNumber: 1,
      };

      const result = createSequentialThinkingRawLlmMessageEntry(state);

      expect(result).toBeNull();
    });

    test('should create empty input object when no state values are defined', () => {
      const state: SequentialThinkingState = {
        entry_id: 'test-entry-empty',
        args: undefined,
        thought: undefined,
        nextThoughtNeeded: undefined,
        thoughtNumber: undefined,
      };

      const result = createSequentialThinkingRawLlmMessageEntry(state);

      expect(result).toEqual({
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'test-entry-empty',
            toolName: 'sequentialThinking',
            input: {},
          },
        ],
      });
    });

    test('should handle all field types correctly', () => {
      const state: SequentialThinkingState = {
        entry_id: 'test-types',
        args: '{"thought": "test"}', // This should not be included in output
        thought: 'String value',
        nextThoughtNeeded: true,
        thoughtNumber: 42,
      };

      const result = createSequentialThinkingRawLlmMessageEntry(state);

      expect(result).toEqual({
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'test-types',
            toolName: 'sequentialThinking',
            input: {
              thought: 'String value',
              nextThoughtNeeded: true,
              thoughtNumber: 42,
            },
          },
        ],
      });
    });
  });
});