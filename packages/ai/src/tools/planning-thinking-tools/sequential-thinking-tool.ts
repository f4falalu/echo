import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

// Core interfaces for Sequential Thinking
interface SequentialThinkingParams {
  thought: string;
  nextThoughtNeeded: boolean;
  thoughtNumber: number;
}

interface SequentialThinkingOutput {
  success: boolean;
}

// Zod schema for input validation
const sequentialThinkingSchema = z.object({
  thought: z
    .string()
    .min(1)
    .describe(
      'Your current thinking step, which can include: Regular analytical steps, Revisions of previous thoughts, Questions about previous decisions, Realizations about needing more analysis, Changes in approach, Hypothesis generation, Hypothesis verification.'
    ),
  nextThoughtNeeded: z.boolean().describe('Whether another thought step is needed.'),
  thoughtNumber: z.number().int().positive().describe('Current number in sequence.'),
});

/**
 * Optimistic parsing function for streaming sequential-thinking tool arguments
 * Extracts key fields as they're being built incrementally
 */
export function parseStreamingArgs(
  accumulatedText: string
): Partial<z.infer<typeof sequentialThinkingSchema>> | null {
  // Validate input type
  if (typeof accumulatedText !== 'string') {
    throw new Error(`parseStreamingArgs expects string input, got ${typeof accumulatedText}`);
  }

  try {
    // First try to parse as complete JSON
    const parsed = JSON.parse(accumulatedText);
    const result: Partial<z.infer<typeof sequentialThinkingSchema>> = {};

    // Only include fields that are actually present
    if (parsed.thought !== undefined) result.thought = parsed.thought;
    if (parsed.nextThoughtNeeded !== undefined) result.nextThoughtNeeded = parsed.nextThoughtNeeded;
    if (parsed.thoughtNumber !== undefined) result.thoughtNumber = parsed.thoughtNumber;

    return result;
  } catch (error) {
    // Only catch JSON parse errors - let other errors bubble up
    if (error instanceof SyntaxError) {
      // If JSON is incomplete, try to extract partial fields
      const result: Partial<z.infer<typeof sequentialThinkingSchema>> = {};

      // Extract thought field (main text content)
      const thoughtMatch = accumulatedText.match(/"thought"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (thoughtMatch && thoughtMatch[1] !== undefined) {
        result.thought = thoughtMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      } else {
        // Try to extract incomplete thought string
        const partialThoughtMatch = accumulatedText.match(/"thought"\s*:\s*"((?:[^"\\]|\\.*)*)/);
        if (partialThoughtMatch && partialThoughtMatch[1] !== undefined) {
          result.thought = partialThoughtMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }
      }

      // Extract boolean fields
      const nextThoughtMatch = accumulatedText.match(/"nextThoughtNeeded"\s*:\s*(true|false)/);
      if (nextThoughtMatch) {
        result.nextThoughtNeeded = nextThoughtMatch[1] === 'true';
      }

      // Extract number fields
      const thoughtNumberMatch = accumulatedText.match(/"thoughtNumber"\s*:\s*(\d+)/);
      if (thoughtNumberMatch && thoughtNumberMatch[1] !== undefined) {
        result.thoughtNumber = Number.parseInt(thoughtNumberMatch[1], 10);
      }

      // Return result if we found at least one field
      return Object.keys(result).length > 0 ? result : null;
    }

    // Unexpected error - re-throw with context
    throw new Error(
      `Unexpected error in parseStreamingArgs: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Tool implementation
export const sequentialThinking = createTool({
  id: 'sequential-thinking',
  description: `A detailed tool for dynamic and reflective problem-solving through thoughts.
This tool helps analyze problems through a flexible thinking process that can adapt and evolve.
Each thought can build on, question, or revise previous insights as understanding deepens.

**When to use this tool:**
- Breaking down complex problems into steps
- Planning and design with room for revision
- Analysis that might need course correction
- Problems that require a multi-step solution
- Tasks that need to maintain context over multiple steps
- Situations where irrelevant information needs to be filtered out

**Key features:**
- You can question or revise previous thoughts
- You can express uncertainty and explore alternative approaches
- Not every thought needs to build linearly - you can branch or backtrack
- Generates a solution hypothesis
- Verifies the hypothesis based on the Chain of Thought steps
- Repeats the process until satisfied
- Provides a correct answer

**You should:**
1. Feel free to question or revise previous thoughts
2. Express uncertainty when present
3. Ignore information that is irrelevant to the current step
4. Generate a solution hypothesis when appropriate
5. Verify the hypothesis based on the Chain of Thought steps
6. Repeat the process until satisfied with the solution
7. Provide a single, ideally correct answer as the final output
8. Only set nextThoughtNeeded to false when truly done and a satisfactory answer is reached`,
  inputSchema: sequentialThinkingSchema,
  outputSchema: z.object({
    success: z.boolean().describe('Whether the thinking step was processed successfully'),
  }),
  execute: async ({ context }) => {
    return await processSequentialThinking(context as SequentialThinkingParams);
  },
});

const processSequentialThinking = wrapTraced(
  async (params: SequentialThinkingParams): Promise<SequentialThinkingOutput> => {
    try {
      // Process the thought with validated context
      await processThought(params);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error in sequential thinking:', error);

      // Provide helpful error messages
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid sequential thinking parameters: ${error.errors.map((e) => e.message).join(', ')}`
        );
      }

      throw new Error(
        `Sequential thinking processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
  { name: 'sequential-thinking' }
);

async function processThought(params: SequentialThinkingParams): Promise<SequentialThinkingParams> {
  return {
    thought: params.thought.trim(),
    nextThoughtNeeded: params.nextThoughtNeeded,
    thoughtNumber: params.thoughtNumber,
  };
}
