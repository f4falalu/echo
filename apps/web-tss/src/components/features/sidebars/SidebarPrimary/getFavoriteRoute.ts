import type { UserFavorite } from '@buster/server-shared/user';
import type { RegisteredRouter } from '@tanstack/react-router';
import { defineLink } from '@/lib/routes';

export const getFavoriteRoute = <
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
>(
  favorite: Pick<UserFavorite, 'asset_type' | 'id'>
) => {
  if (favorite.asset_type === 'chat') {
    return defineLink({
      to: '/app/chats/$chatId',
      params: { chatId: '123' },
    });
  }

  if (favorite.asset_type === 'metric') {
    return defineLink({
      to: '/app/metrics/$metricId',
      params: { metricId: favorite.id },
    });
  }

  if (favorite.asset_type === 'dashboard') {
    return defineLink({
      to: '/app/dashboards/$dashboardId',
      params: { dashboardId: favorite.id },
    });
  }

  if (favorite.asset_type === 'collection') {
    return defineLink({
      to: '/app/collections/$collectionId',
      params: { collectionId: favorite.id },
    });
  }

  if (favorite.asset_type === 'report') {
    return defineLink({
      to: '/app/reports/$reportId',
      params: { reportId: favorite.id },
    });
  }

  const _exhaustiveCheck: never = favorite.asset_type;

  return defineLink({
    to: '/app/chats/$chatId',
    params: { chatId: favorite.id },
  });
};
