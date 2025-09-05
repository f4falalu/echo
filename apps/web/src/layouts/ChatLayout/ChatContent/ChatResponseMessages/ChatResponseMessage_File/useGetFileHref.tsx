import type { RegisteredRouter } from '@tanstack/react-router';
import { useMemo } from 'react';
import type { BusterChatResponseMessage_file } from '@/api/asset_interfaces/chat';
import { assetParamsToRoute } from '@/lib/assets/assetParamsToRoute';
import type { ILinkProps } from '@/types/routes';

export const useGetFileHref = <
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
>({
  responseMessage,
  isSelectedFile,
  chatId,
}: {
  responseMessage: BusterChatResponseMessage_file;
  isSelectedFile: boolean;
  chatId: string;
}) => {
  const { file_type, id, version_number } = responseMessage;

  const href: ILinkProps<TRouter, TOptions, TFrom> = useMemo(() => {
    if (!chatId)
      return {
        to: '/app/home',
      } as ILinkProps<TRouter, TOptions, TFrom>;

    if (isSelectedFile || file_type === 'reasoning') {
      return {
        to: '/app/chats/$chatId',
        params: {
          chatId,
        },
      } as ILinkProps<TRouter, TOptions, TFrom>;
    }

    const link = assetParamsToRoute({
      assetId: id,
      assetType: file_type,
      chatId,
      versionNumber: version_number,
    }) as ILinkProps<TRouter, TOptions, TFrom>;

    return link;
  }, [chatId, file_type, id, version_number, isSelectedFile]);

  return href;
};
