import React from 'react';
import { BusterTermsIndividualProvider } from './BusterTermsIndividualProvider';

export const BusterTermsProvider: React.FC<{
  children: React.ReactNode;
}> = React.memo(({ children }) => {
  return <BusterTermsIndividualProvider>{children}</BusterTermsIndividualProvider>;
});

BusterTermsProvider.displayName = 'BusterTermsProvider';
