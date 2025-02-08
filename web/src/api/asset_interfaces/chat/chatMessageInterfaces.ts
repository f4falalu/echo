import type { FileType, ThoughtFileType } from './config';

export type BusterChatMessage = {
  id: string;
  request_message: BusterChatMessageRequest;
  response_messages: BusterChatMessageResponse[];
  reasoning: BusterChatMessageReasoning[];
  created_at: string;
};

export type BusterChatMessageRequest = null | {
  request: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string | null;
};

export type BusterChatMessageResponse = BusterChatMessage_text | BusterChatMessage_file;

export type BusterChatMessage_text = {
  id: string;
  type: 'text';
  message: string;
  message_chunk?: string;
  hidden?: boolean;
};

export type BusterChatMessage_fileMetadata = {
  status: 'loading' | 'completed' | 'failed';
  message: string;
  timestamp?: number;
};

export type BusterChatMessage_file = {
  id: string;
  type: 'file';
  file_type: FileType;
  file_name: string;
  version_number: number;
  version_id: string;
  metadata?: BusterChatMessage_fileMetadata[];
  hidden?: boolean; //if left undefined, will automatically be set to true
};

export type BusterChatMessageReasoning =
  | BusterChatMessageReasoning_thought
  | BusterChatMessageReasoning_text;

export type BusterChatMessageReasoning_thoughtPill = {
  text: string;
  type: ThoughtFileType;
  id: string;
};

export type BusterChatMessageReasoning_thought = {
  id: string;
  type: 'thought';
  thought_title: string;
  thought_secondary_title: string;
  thought_pills?: BusterChatMessageReasoning_thoughtPill[];
  status?: 'loading' | 'completed' | 'failed'; //if left undefined, will automatically be set to 'loading' if the chat stream is in progress AND there is no message after it
};

export type BusterChatMessageReasoning_text = {
  id: string;
  type: 'text';
  message: string;
  message_chunk?: string;
};
