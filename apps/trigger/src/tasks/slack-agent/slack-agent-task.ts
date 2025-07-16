import { type TaskOutput, schemaTask } from '@trigger.dev/sdk';
import { z } from 'zod';

const SlackAgentTaskInputSchema = z.object({
  chatId: z.string().uuid(),
});

const SlackAgentTaskOutputSchema = z.object({});

export type SlackAgentTaskInput = z.infer<typeof SlackAgentTaskInputSchema>;
export type SlackAgentTaskOutput = z.infer<typeof SlackAgentTaskOutputSchema>;

export const slackAgentTask: ReturnType<
  typeof schemaTask<'slack-agent-task', typeof SlackAgentTaskInputSchema, SlackAgentTaskOutput>
> = schemaTask<'slack-agent-task', typeof SlackAgentTaskInputSchema, SlackAgentTaskOutput>({
  id: 'slack-agent-task',
  schema: SlackAgentTaskInputSchema,
  maxDuration: 300, // 300 seconds timeout
  run: async (payload: SlackAgentTaskInput): Promise<SlackAgentTaskOutput> => {
    return {
      message: 'Hello, world!',
    };
  },
});
