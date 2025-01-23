export type AppChatMessage = {
  id: string;
  sentMessage: AppChatSentMessage;
  responseMessage: AppChatResponseMessage;
};

export type AppChatSentMessage = {
  name: string;
  avatar?: string;
  text: string;
};

export type AppChatResponseMessage = (
  | AppChatMessageMarkdown
  | AppChatMessageThought
  | AppChatMessageFile
) & {
  hidden?: boolean;
};

export type AppChatMessageMarkdown = string;

export type AppChatMessageThought = {
  text: string;
  type: 'dataset' | 'terms' | 'values';
  timestamp?: number;
  pills?: {
    text: string;
    id: string;
  }[];
};

export type AppChatMessageFileType = 'dataset' | 'collection' | 'metric' | 'dashboard';

export type AppChatMessageFile = {
  type: AppChatMessageFileType;
  id: string;
  name: string;
  version: string;
  metadata: {
    status: 'loading' | 'completed' | 'failed';
    message: string;
    timestamp?: number;
  }[];
};
