import type { LanguageModelV2ToolCall } from '@ai-sdk/provider';
import { generateObject } from 'ai';
import type { ToolSet } from 'ai';
import type { z } from 'zod';
import { Haiku35 } from '../models/haiku-3-5';

interface ToolCallWithArgs extends LanguageModelV2ToolCall {
  args?: unknown;
}

export async function healToolWithLlm({
  toolCall,
  tools,
}: {
  toolCall: LanguageModelV2ToolCall;
  tools: ToolSet;
}) {
  try {
    const tool = tools[toolCall.toolName as keyof typeof tools];

    if (!tool) {
      throw new Error(`Tool ${toolCall.toolName} not found`);
    }

    if (!tool.inputSchema) {
      throw new Error(`Tool ${toolCall.toolName} has no input schema`);
    }

    // Type assertion to access args property
    const toolCallWithArgs = toolCall as ToolCallWithArgs;

    const { object: repairedArgs } = await generateObject({
      model: Haiku35,
      schema: tool.inputSchema,
      prompt: [
        `The model tried to call the tool "${toolCall.toolName}"`,
        `with the following arguments:`,
        JSON.stringify(toolCallWithArgs.args),
        `The tool accepts the following schema:`,
        JSON.stringify(tool.inputSchema),
        'Please fix the arguments.',
      ].join('\n'),
    });

    return { ...toolCall, args: repairedArgs } as LanguageModelV2ToolCall;
  } catch (error) {
    console.error('Failed to heal tool call with LLM:', error);
    console.error('Tool call that failed:', toolCall);

    // Re-throw with more context
    throw new Error(
      `Failed to heal tool call "${toolCall.toolName}": ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
