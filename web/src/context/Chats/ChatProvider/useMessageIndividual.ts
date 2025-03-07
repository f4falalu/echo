import { queryKeys } from '@/api/query_keys';
import { useQuery } from '@tanstack/react-query';
import type { IBusterChatMessage } from '@/api/asset_interfaces/chat';

type MessageSelector<T> = (message: IBusterChatMessage | undefined) => T;

export function useMessageIndividual<T>(messageId: string, selector?: MessageSelector<T>): T;
export function useMessageIndividual(messageId: string): IBusterChatMessage | undefined;
export function useMessageIndividual<T>(messageId: string, selector?: MessageSelector<T>) {
  const options = queryKeys.chatsMessages(messageId);
  const { data } = useQuery({ ...options, enabled: false, select: selector });
  return data;
}
