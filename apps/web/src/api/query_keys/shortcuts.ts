import type { ListShortcutsResponse, Shortcut } from '@buster/server-shared/shortcuts';
import { queryOptions } from '@tanstack/react-query';

const shortcutsGetList = queryOptions<ListShortcutsResponse>({
  queryKey: ['shortcuts', 'list'] as const,
  staleTime: 1000 * 60 * 15, // 15 minutes
});

const shortcutsGet = (id: string) =>
  queryOptions<Shortcut>({
    queryKey: ['shortcuts', id] as const,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

export const shortcutsQueryKeys = {
  shortcutsGetList,
  shortcutsGet,
};
