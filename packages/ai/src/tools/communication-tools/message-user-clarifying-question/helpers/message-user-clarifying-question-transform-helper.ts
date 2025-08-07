import type { ChatMessageResponseMessage } from '@buster/server-shared/chats';
import type { CoreMessage } from 'ai';
import type { MessageUserClarifyingQuestionInput } from '../message-user-clarifying-question';

// Key definitions for type-safe extraction
export const MESSAGE_USER_CLARIFYING_QUESTION_KEYS = {
  clarifying_question: 'clarifying_question',
} as const;

// Helper to create response entry for clarifying question
export function messageUserClarifyingQuestionResponseMessage(
  toolCallId: string,
  clarifyingQuestion: string
): ChatMessageResponseMessage {
  return {
    id: toolCallId,
    type: 'text',
    message: clarifyingQuestion,
    is_final_message: true,
  };
}

// Helper to create raw LLM message entry
export function messageUserClarifyingQuestionRawLlmMessageEntry(
  toolCallId: string,
  toolName: string,
  input: MessageUserClarifyingQuestionInput
): CoreMessage {
  return {
    role: 'assistant',
    content: [
      {
        type: 'tool-call',
        toolCallId,
        toolName,
        args: input,
      },
    ],
  };
}

// Helper to extract clarifying question value from optimistic parse
export function extractClarifyingQuestion(extractedValues: Map<string, unknown>): string {
  const question = extractedValues.get(MESSAGE_USER_CLARIFYING_QUESTION_KEYS.clarifying_question);

  if (typeof question === 'string') {
    return question;
  }

  return '';
}

// Helper to update progress message during streaming
export function updateClarifyingQuestionProgressMessage(currentQuestion: string): string {
  if (!currentQuestion) {
    return 'Preparing clarifying question...';
  }

  const wordCount = currentQuestion.split(/\s+/).length;
  return `Writing clarifying question (${wordCount} words)...`;
}
