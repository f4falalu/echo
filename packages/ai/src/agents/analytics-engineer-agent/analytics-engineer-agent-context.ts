import type { Sandbox } from '@buster/sandbox';
import { z } from 'zod';

// Best practice: Use const object for keys
export const AnalyticsEngineerAgentContextKeys = {
  TodoList: 'todoList',
  ClarificationQuestions: 'clarificationQuestions',
  DataSourceId: 'dataSourceId',
} as const;

// Extract type from const object
export type AnalyticsEngineerAgentContextKey = keyof typeof AnalyticsEngineerAgentContextKeys;

export const ClarifyingQuestionSchema = z.object({
  issue: z.string(),
  context: z.string(),
  clarificationQuestion: z.string(),
});

export type MessageUserClarifyingQuestion = z.infer<typeof ClarifyingQuestionSchema>;

// Use the const keys in your schema
export const AnalyticsEngineerAgentContextSchema = z.object({
  [AnalyticsEngineerAgentContextKeys.TodoList]: z.string(),
  [AnalyticsEngineerAgentContextKeys.ClarificationQuestions]: z.array(ClarifyingQuestionSchema),
  [AnalyticsEngineerAgentContextKeys.DataSourceId]: z.string().uuid(),
});

export type AnalyticsEngineerAgentContext = z.infer<typeof AnalyticsEngineerAgentContextSchema>;
