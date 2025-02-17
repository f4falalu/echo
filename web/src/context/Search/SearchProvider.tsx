import { useMemoizedFn } from 'ahooks';
import React from 'react';
import { useBusterWebSocket } from '../BusterWebSocket';
import { BusterSearchResult } from '@/api/asset_interfaces';
import { BusterSearchRequest } from '@/api/buster_socket/search';
import { allBusterSearchRequestKeys } from './config';
import {
  createContext,
  ContextSelector,
  useContextSelector
} from '@fluentui/react-context-selector';

export const useBusterSearch = () => {
  const busterSocket = useBusterWebSocket();

  const onBusterSearch = useMemoizedFn(async ({ query }: { query: string }) => {
    const payload: BusterSearchRequest['payload'] = {
      query
    };

    return [];
  });

  return { onBusterSearch };
};

const BusterSearch = createContext<ReturnType<typeof useBusterSearch>>(
  {} as ReturnType<typeof useBusterSearch>
);

export const BusterSearchProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const value = useBusterSearch();

  return <BusterSearch.Provider value={value}>{children}</BusterSearch.Provider>;
};

export const useBusterSearchContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useBusterSearch>, T>
) => useContextSelector(BusterSearch, selector);
