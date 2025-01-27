import type { BusterChatMessageResponse } from './chatMessageInterfaces';

enum BusterChatStepProgress {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

type BusterChatStepBase = {
  chat_id: string;
  message_id: string;
  progress: BusterChatStepProgress;
};

export type ChatPost_generatingTitle = {
  title: string;
  title_chunk: string;
} & BusterChatStepBase;

export type ChatPost_generatingMessage = {
  message: BusterChatMessageResponse;
} & BusterChatStepBase;
