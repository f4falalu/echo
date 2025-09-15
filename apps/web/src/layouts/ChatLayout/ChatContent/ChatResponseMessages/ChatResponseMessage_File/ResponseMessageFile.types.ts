import type { RegisteredRouter } from '@tanstack/react-router';
import type { BusterChatResponseMessage_file } from '@/api/asset_interfaces/chat';
import type { ILinkProps } from '@/types/routes';

export type ResponseMessageFileProps<
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = Record<string, unknown>,
  TFrom extends string = string,
> = {
  responseMessage: BusterChatResponseMessage_file;
  isSelectedFile: boolean;
  linkParams: ILinkProps<TRouter, TOptions, TFrom>;
  isStreamFinished: boolean;
  chatId: string;
};
