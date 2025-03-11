'use client';

import React from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import { useGetTermsList } from '@/api/buster_rest/terms';

export const useBusterTermsList = () => {
  const {
    data: termsList,
    refetch: refetchTermsList,
    isFetched: isFetchedTermsList
  } = useGetTermsList({ page: 0, page_size: 3000 });

  return {
    termsList,
    refetchTermsList,
    isFetchedTermsList
  };
};

const BusterTermsListContext = createContext<ReturnType<typeof useBusterTermsList>>(
  {} as ReturnType<typeof useBusterTermsList>
);

export const BusterTermsListProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BusterTermsListContext.Provider value={useBusterTermsList()}>
      {children}
    </BusterTermsListContext.Provider>
  );
};

export const useBusterTermsListContextSelector = <T,>(
  selector: (state: ReturnType<typeof useBusterTermsList>) => T
) => useContextSelector(BusterTermsListContext, selector);
