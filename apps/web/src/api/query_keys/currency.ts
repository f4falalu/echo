import { queryOptions } from '@tanstack/react-query';
import { CurrencyResponse } from '@buster/server-shared/currency';

export const getCurrencies = queryOptions<CurrencyResponse>({
  queryKey: ['nextjs', 'list', 'currencies'],
  initialData: [],
  initialDataUpdatedAt: 0,
  staleTime: 1000 * 60 * 60 * 24 * 7 //7 days
});

export const currencyQueryKeys = {
  getCurrencies
};
