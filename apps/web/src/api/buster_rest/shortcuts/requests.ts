import type {
  CreateShortcutRequest,
  ListShortcutsResponse,
  Shortcut,
  UpdateShortcutRequest,
} from '@buster/server-shared/shortcuts';
import { mainApiV2 } from '../instances';

export const listShortcuts = async (): Promise<ListShortcutsResponse> => {
  return mainApiV2.get<ListShortcutsResponse>('/shortcuts').then((response) => response.data);
};

export const getShortcut = async ({ id }: { id: string }): Promise<Shortcut> => {
  return mainApiV2.get<Shortcut>(`/shortcuts/${id}`).then((response) => response.data);
};

export const createShortcut = async (data: CreateShortcutRequest): Promise<Shortcut> => {
  return mainApiV2.post<Shortcut>('/shortcuts', data).then((response) => response.data);
};

export const updateShortcut = async ({
  id,
  ...data
}: { id: string } & UpdateShortcutRequest): Promise<Shortcut> => {
  return mainApiV2.put<Shortcut>(`/shortcuts/${id}`, data).then((response) => response.data);
};

export const deleteShortcut = async ({ id }: { id: string }): Promise<{ success: boolean }> => {
  return mainApiV2
    .delete<{ success: boolean }>(`/shortcuts/${id}`)
    .then((response) => response.data);
};
