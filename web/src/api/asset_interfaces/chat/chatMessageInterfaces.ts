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
  is_final_message?: boolean; //defaults to false
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
  filter_version_id: string | null;
  metadata?: BusterChatMessage_fileMetadata[];
};

export type BusterChatMessageReasoning =
  | BusterChatMessageReasoning_thought
  | BusterChatMessageReasoning_text
  | BusterChatMessageReasoning_file;

export type BusterChatMessageReasoning_thoughtPill = {
  text: string;
  type: ThoughtFileType;
  id: string;
};

export type BusterChatMessageReasoning_thoughtPillContainer = {
  title: string;
  thought_pills: BusterChatMessageReasoning_thoughtPill[];
};

export type BusterChatMessageReasoning_status = 'loading' | 'completed' | 'failed';

export type BusterChatMessageReasoning_thought = {
  id: string;
  type: 'thought';
  thought_title: string;
  thought_secondary_title: string;
  thoughts?: BusterChatMessageReasoning_thoughtPillContainer[];
  status?: BusterChatMessageReasoning_status; //if left undefined, will automatically be set to 'loading' if the chat stream is in progress AND there is no message after it
};

export type BusterChatMessageReasoning_text = {
  id: string;
  type: 'text';
  message: string;
  message_chunk?: string;
  status?: BusterChatMessageReasoning_status;
};

export type BusterChatMessageReasoning_file = {
  id: string;
  type: 'file';
  file_type: FileType;
  file_name: string;
  version_number: number;
  version_id: string;
  status?: BusterChatMessageReasoning_status;
  //when we are streaming, the whole file will always be streamed back, not chunks
  file?: {
    text: string;
    line_number: number;
    modified?: boolean; //defaults to true
  }[]; //will be defined if the file has been completed OR on a page refresh
};
