import { type TaskOutput, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";


const SlackAgentTaskInputSchema = z.object({
  message: z.string(),
});

const SlackAgentTaskOutputSchema = z.object({
});

type SlackAgentTaskInput = z.infer<typeof SlackAgentTaskInputSchema>;
type SlackAgentTaskOutput = z.infer<typeof SlackAgentTaskOutputSchema>;

export const slackAgentTask: ReturnType<
  typeof schemaTask<'slack-agent', typeof SlackAgentTaskInputSchema, SlackAgentTaskOutput>
> = schemaTask<'slack-agent', typeof SlackAgentTaskInputSchema, SlackAgentTaskOutput>({
  id: 'slack-agent',
  schema: SlackAgentTaskInputSchema,
  maxDuration: 300, // 300 seconds timeout
  run: async (payload: SlackAgentTaskInput): Promise<SlackAgentTaskOutput> => {
    return {
      message: 'Hello, world!',
    };
  },
});