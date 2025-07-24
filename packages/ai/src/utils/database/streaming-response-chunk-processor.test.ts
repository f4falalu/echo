import type { TextStreamPart } from 'ai';
import { describe, expect, it } from 'vitest';
import { ChunkProcessor } from './chunk-processor';

describe('ChunkProcessor - Response Message Streaming', () => {
  describe('doneTool streaming', () => {
    it('should create and update response message as final_response streams', async () => {
      // Use null messageId to avoid database writes in tests
      const availableTools = new Set(['doneTool']);
      const processor = new ChunkProcessor(null, [], [], [], undefined, availableTools);
      const toolCallId = 'done-tool-1';

      // Start the tool call
      await processor.processChunk({
        type: 'tool-call-streaming-start',
        toolCallId,
        toolName: 'doneTool',
      } as TextStreamPart<never>);

      // Check initial state - should have empty response entry
      expect(processor.getResponseHistory()).toHaveLength(1);
      expect(processor.getResponseHistory()[0]).toMatchObject({
        id: toolCallId,
        type: 'text',
        message: '',
        is_final_message: true,
      });

      // Stream partial final_response
      await processor.processChunk({
        type: 'tool-call-delta',
        toolCallId,
        toolName: 'doneTool',
        argsTextDelta: '{"final_response": "Hello',
      } as TextStreamPart<never>);

      // Should now have a response entry with partial content
      let responseHistory = processor.getResponseHistory();
      expect(responseHistory).toHaveLength(1);
      expect(responseHistory[0]).toMatchObject({
        id: toolCallId,
        type: 'text',
        message: 'Hello',
        is_final_message: true,
      });

      // Continue streaming
      await processor.processChunk({
        type: 'tool-call-delta',
        toolCallId,
        toolName: 'doneTool',
        argsTextDelta: ', I can help you',
      } as TextStreamPart<never>);

      responseHistory = processor.getResponseHistory();
      expect((responseHistory[0]! as any).message).toBe('Hello, I can help you');

      // Complete the response
      await processor.processChunk({
        type: 'tool-call-delta',
        toolCallId,
        toolName: 'doneTool',
        argsTextDelta: ' with that task."}',
      } as TextStreamPart<never>);

      responseHistory = processor.getResponseHistory();
      expect((responseHistory[0]! as any).message).toBe('Hello, I can help you with that task.');
    });

    it('should handle complete doneTool call (non-streaming)', async () => {
      const availableTools = new Set(['doneTool']);
      const processor = new ChunkProcessor(null, [], [], [], undefined, availableTools);
      const toolCallId = 'done-tool-2';

      // Complete tool call
      await processor.processChunk({
        type: 'tool-call',
        toolCallId,
        toolName: 'doneTool',
        args: {
          final_response: 'This is the complete response.',
        },
      } as unknown as TextStreamPart<never>);

      const responseHistory = processor.getResponseHistory();
      expect(responseHistory).toHaveLength(1);
      expect(responseHistory[0]).toMatchObject({
        id: toolCallId,
        type: 'text',
        message: 'This is the complete response.',
        is_final_message: true,
      });
    });
  });

  describe('respondWithoutAssetCreation streaming', () => {
    it('should create and update response message as response streams', async () => {
      const availableTools = new Set(['respondWithoutAssetCreation']);
      const processor = new ChunkProcessor(null, [], [], [], undefined, availableTools);
      const toolCallId = 'respond-tool-1';

      // Start the tool call
      await processor.processChunk({
        type: 'tool-call-streaming-start',
        toolCallId,
        toolName: 'respondWithoutAssetCreation',
      } as TextStreamPart<never>);

      // Stream partial response
      await processor.processChunk({
        type: 'tool-call-delta',
        toolCallId,
        toolName: 'respondWithoutAssetCreation',
        argsTextDelta: '{"final_response": "Based on',
      } as TextStreamPart<never>);

      let responseHistory = processor.getResponseHistory();
      expect(responseHistory).toHaveLength(1);
      expect(responseHistory[0]).toMatchObject({
        id: toolCallId,
        type: 'text',
        message: 'Based on',
        is_final_message: true,
      });

      // Continue streaming
      await processor.processChunk({
        type: 'tool-call-delta',
        toolCallId,
        toolName: 'respondWithoutAssetCreation',
        argsTextDelta: ' the analysis"}',
      } as TextStreamPart<never>);

      responseHistory = processor.getResponseHistory();
      expect((responseHistory[0]! as any).message).toBe('Based on the analysis');
    });
  });

  describe('response tools should not create reasoning entries', () => {
    it('should not create reasoning entries for doneTool', async () => {
      const availableTools = new Set(['doneTool']);
      const processor = new ChunkProcessor(null, [], [], [], undefined, availableTools);
      const toolCallId = 'done-tool-3';

      await processor.processChunk({
        type: 'tool-call',
        toolCallId,
        toolName: 'doneTool',
        args: {
          final_response: 'Final message',
        },
      } as unknown as TextStreamPart<never>);

      // Should have response entry but no reasoning entry
      expect(processor.getResponseHistory()).toHaveLength(1);
      expect(processor.getReasoningHistory()).toHaveLength(0);
    });

    it('should not create reasoning entries for respondWithoutAssetCreation', async () => {
      const availableTools = new Set(['respondWithoutAssetCreation']);
      const processor = new ChunkProcessor(null, [], [], [], undefined, availableTools);
      const toolCallId = 'respond-tool-2';

      await processor.processChunk({
        type: 'tool-call',
        toolCallId,
        toolName: 'respondWithoutAssetCreation',
        args: {
          final_response: 'Quick response',
        },
      } as unknown as TextStreamPart<never>);

      // Should have response entry but no reasoning entry
      expect(processor.getResponseHistory()).toHaveLength(1);
      expect(processor.getReasoningHistory()).toHaveLength(0);
    });
  });

  describe('mixed tool streaming', () => {
    it('should handle both reasoning and response tools in same stream', async () => {
      const availableTools = new Set(['sequentialThinking', 'doneTool']);
      const processor = new ChunkProcessor(null, [], [], [], undefined, availableTools);

      // First a thinking tool
      await processor.processChunk({
        type: 'tool-call',
        toolCallId: 'think-1',
        toolName: 'sequentialThinking',
        args: {
          thought: 'Let me analyze this...',
          nextThoughtNeeded: true,
        },
      } as unknown as TextStreamPart<never>);

      // Then a response tool
      await processor.processChunk({
        type: 'tool-call',
        toolCallId: 'done-1',
        toolName: 'doneTool',
        args: {
          final_response: 'Here is my conclusion.',
        },
      } as unknown as TextStreamPart<never>);

      // Should have one reasoning and one response
      expect(processor.getReasoningHistory()).toHaveLength(1);
      expect(processor.getReasoningHistory()[0]).toMatchObject({
        type: 'text',
        title: 'Thinking it through...',
        message: 'Let me analyze this...',
      });

      expect(processor.getResponseHistory()).toHaveLength(1);
      expect(processor.getResponseHistory()[0]).toMatchObject({
        type: 'text',
        message: 'Here is my conclusion.',
        is_final_message: true,
      });
    });
  });
});
