import type { Sandbox } from '@buster/sandbox';
import { z } from 'zod';

export enum DocsAgentContextKey {
  Sandbox = 'sandbox',
  TodoListFile = 'todoListFile',
  ClarificationFile = 'clarificationFile',
}

export const ClarifyingQuestionSchema = z.object({
  issue: z.string(),
  context: z.string(),
  clarificationQuestion: z.string(),
});

export type MessageUserClarifyingQuestion = z.infer<typeof ClarifyingQuestionSchema>;

export type DocsAgentContext = {
  sandbox: Sandbox;
  todoList: string;
  clarificationQuestion: MessageUserClarifyingQuestion;
};
