import { useQuery } from '@tanstack/react-query';

enum QUERY_REQUEST_KEYS {
  getCurrencies = 'getCurrencies'
}

export const useGetCurrencies = ({ enabled }: { enabled: boolean }) => {
  return useQuery({
    queryKey: [QUERY_REQUEST_KEYS.getCurrencies],
    queryFn: () =>
      fetch('/api/currency').then(
        async (res) => (await res.json()) as { code: string; description: string; flag: string }[]
      ),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled
  });
};
