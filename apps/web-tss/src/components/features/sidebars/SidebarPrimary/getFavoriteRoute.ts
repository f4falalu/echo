import type { UserFavorite } from '@buster/server-shared/user';
import type { OptionsTo } from '@/types/routes';

export const getFavoriteRoute = (favorite: Pick<UserFavorite, 'asset_type' | 'id'>): OptionsTo => {
  if (favorite.asset_type === 'chat') {
    return {
      to: '/app/chats/$chatId',
      params: { chatId: favorite.id },
    } as const satisfies OptionsTo;
  }

  if (favorite.asset_type === 'metric') {
    return {
      to: '/app/metrics/$metricId',
      params: { metricId: favorite.id },
    } as const satisfies OptionsTo;
  }

  if (favorite.asset_type === 'dashboard') {
    return {
      to: '/app/dashboards/$dashboardId',
      params: { dashboardId: favorite.id },
    } as const satisfies OptionsTo;
  }

  if (favorite.asset_type === 'collection') {
    return {
      to: '/app/collections/$collectionId',
      params: { collectionId: favorite.id },
    } as const satisfies OptionsTo;
  }

  if (favorite.asset_type === 'report') {
    return {
      to: '/app/reports/$reportId',
      params: { reportId: favorite.id },
    } as const satisfies OptionsTo;
  }

  const _exhaustiveCheck: never = favorite.asset_type;
  return {
    to: '/app/chats/$chatId',
    params: { chatId: favorite.id },
  } as const satisfies OptionsTo;
};
