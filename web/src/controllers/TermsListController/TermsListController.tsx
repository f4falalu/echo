'use client';

import React, { useState } from 'react';
import { TermsListContent } from './TermsListContent';
import { TermsHeader } from './TermsHeader';

export const TermsListController: React.FC = () => {
  const [openNewTermsModal, setOpenNewTermsModal] = useState(false);

  return (
    <>
      <TermsHeader
        openNewTermsModal={openNewTermsModal}
        setOpenNewTermsModal={setOpenNewTermsModal}
      />
      <TermsListContent
        openNewTermsModal={openNewTermsModal}
        setOpenNewTermsModal={setOpenNewTermsModal}
      />
    </>
  );
};
