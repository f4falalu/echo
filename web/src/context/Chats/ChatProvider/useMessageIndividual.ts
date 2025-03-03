import { queryKeys } from '@/api/query_keys';
import { useQuery } from '@tanstack/react-query';

export const useMessageIndividual = (messageId: string) => {
  const options = queryKeys['chatsMessages'](messageId);
  const { data: message } = useQuery({ ...options, enabled: false });
  return message;
};
