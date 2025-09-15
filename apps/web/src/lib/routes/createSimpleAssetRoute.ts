import type { AssetType } from '@buster/server-shared/assets';
import type { RegisteredRouter } from '@tanstack/react-router';
import type { FileType } from '@/api/asset_interfaces';
import { defineLink } from '@/lib/routes';
import type { ILinkProps } from '@/types/routes';

export const createSimpleAssetRoute = <
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
>(asset: {
  asset_type: AssetType;
  id: string;
}) => {
  if (asset.asset_type === 'chat') {
    return defineLink({
      to: '/app/chats/$chatId',
      params: { chatId: asset.id },
    });
  }

  if (asset.asset_type === 'metric') {
    return defineLink({
      to: '/app/metrics/$metricId',
      params: { metricId: asset.id },
    });
  }

  if (asset.asset_type === 'dashboard') {
    return defineLink({
      to: '/app/dashboards/$dashboardId',
      params: { dashboardId: asset.id },
    });
  }

  if (asset.asset_type === 'collection') {
    return defineLink({
      to: '/app/collections/$collectionId',
      params: { collectionId: asset.id },
    });
  }

  if (asset.asset_type === 'report') {
    return defineLink({
      to: '/app/reports/$reportId',
      params: { reportId: asset.id },
    });
  }

  const _exhaustiveCheck: never = asset.asset_type;

  return defineLink({
    to: '/app/chats/$chatId',
    params: { chatId: asset.id },
  });
};

export const createChatAssetRoute = (asset: {
  asset_type: AssetType | FileType | undefined;
  id: string | undefined;
  chatId: string;
}) => {
  if (!asset.asset_type || !asset.id) {
    return defineLink({
      to: '/app/chats/$chatId',
      params: { chatId: asset.chatId },
    });
  }

  if (asset.asset_type === 'chat') {
    return defineLink({
      to: '/app/chats/$chatId',
      params: { chatId: asset.chatId },
    });
  }

  if (asset.asset_type === 'metric') {
    return defineLink({
      to: '/app/chats/$chatId/metrics/$metricId',
      params: { metricId: asset.id || '', chatId: asset.chatId },
    });
  }

  if (asset.asset_type === 'dashboard') {
    return defineLink({
      to: '/app/chats/$chatId/dashboards/$dashboardId',
      params: { dashboardId: asset.id || '', chatId: asset.chatId },
    });
  }

  if (asset.asset_type === 'collection') {
    return defineLink({
      to: '/app/collections/$collectionId',
      params: { collectionId: asset.id || '' },
    });
  }

  if (asset.asset_type === 'report') {
    return defineLink({
      to: '/app/chats/$chatId/reports/$reportId',
      params: { reportId: asset.id || '', chatId: asset.chatId },
    });
  }

  if (asset.asset_type === 'reasoning') {
    return defineLink({
      to: '/app/chats/$chatId/reasoning/$messageId',
      params: { chatId: asset.chatId, messageId: asset.id || '' },
    });
  }

  const _exhaustiveCheck: never = asset.asset_type;

  return defineLink({
    to: '/app/chats/$chatId',
    params: { chatId: asset.chatId },
  });
};
