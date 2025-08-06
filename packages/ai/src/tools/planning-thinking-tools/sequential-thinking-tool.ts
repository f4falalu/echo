import { tool } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

// Zod schema for input validation
const SequentialThinkingInputSchema = z.object({
  thought: z
    .string()
    .min(1)
    .describe(
      'Your current thinking step, which can include: Regular analytical steps, Revisions of previous thoughts, Questions about previous decisions, Realizations about needing more analysis, Changes in approach, Hypothesis generation, Hypothesis verification.'
    ),
  nextThoughtNeeded: z.boolean().describe('Whether another thought step is needed.'),
  thoughtNumber: z.number().int().positive().describe('Current number in sequence.'),
});

const SequentialThinkingOutputSchema = z.object({
  success: z.boolean().describe('Whether the thinking step was processed successfully'),
});

type SequentialThinkingInput = z.infer<typeof SequentialThinkingInputSchema>;
type SequentialThinkingOutput = z.infer<typeof SequentialThinkingOutputSchema>;

// Tool implementation
export const sequentialThinking = tool({
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
  inputSchema: SequentialThinkingInputSchema,
  outputSchema: SequentialThinkingOutputSchema,
  execute: async (input) => {
    return await processSequentialThinking(input);
  },
});

const processSequentialThinking = wrapTraced(
  async (params: SequentialThinkingInput): Promise<SequentialThinkingOutput> => {
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

async function processThought(params: SequentialThinkingInput): Promise<SequentialThinkingInput> {
  return {
    thought: params.thought.trim(),
    nextThoughtNeeded: params.nextThoughtNeeded,
    thoughtNumber: params.thoughtNumber,
  };
}
