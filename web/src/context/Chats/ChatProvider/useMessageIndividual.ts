import { queryKeys } from '@/api/query_keys';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { IBusterChatMessage } from '../interfaces';

type MessageSelector<T> = (message: IBusterChatMessage | undefined) => T;

export function useMessageIndividual<T>(messageId: string, selector?: MessageSelector<T>): T;
export function useMessageIndividual(messageId: string): IBusterChatMessage | undefined;
export function useMessageIndividual<T>(messageId: string, selector?: MessageSelector<T>) {
  const options = queryKeys['chatsMessages'](messageId);
  const { data: message } = useQuery({ ...options, enabled: false });

  return useMemo(() => {
    if (!selector) return message;
    return selector(message);
  }, [message, selector]);
}
