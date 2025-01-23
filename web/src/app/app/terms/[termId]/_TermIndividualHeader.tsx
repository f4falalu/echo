'use client';

import React from 'react';
import { AppContentHeader } from '../../../../components/layout/AppContentHeader';
import { TermsHeader } from '../_TermsHeader';

export const TermIndividualHeader: React.FC<{
  termId: string;
}> = ({ termId }) => {
  return <TermsHeader termId={termId} />;
};
