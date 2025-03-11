'use client';

import type { SearchParams } from '@/api/request_interfaces/search';
import { useMemoizedFn } from '@/hooks';
import React from 'react';
import { createContext, useContextSelector } from 'use-context-selector';

export const useBusterSearch = () => {
  const onBusterSearch = useMemoizedFn(async ({ query }: { query: string }) => {
    const payload: SearchParams = {
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
  selector: (state: ReturnType<typeof useBusterSearch>) => T
) => useContextSelector(BusterSearch, selector);
