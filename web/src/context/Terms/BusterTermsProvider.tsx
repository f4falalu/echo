import React from 'react';
import { BusterTermsListProvider } from './BusterTermsListProvider';
import { BusterTermsIndividualProvider } from './BusterTermsIndividualProvider';

export const BusterTermsProvider: React.FC<{
  children: React.ReactNode;
}> = React.memo(({ children }) => {
  return (
    <BusterTermsListProvider>
      <BusterTermsIndividualProvider>{children}</BusterTermsIndividualProvider>
    </BusterTermsListProvider>
  );
});

BusterTermsProvider.displayName = 'BusterTermsProvider';
