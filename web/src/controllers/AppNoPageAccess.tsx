'use client';

import React from 'react';
import { BusterLogo } from '@/assets/svg/BusterLogo';
import { Title } from '@/components/ui/typography';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { Button } from '@/components/ui/buttons';
import Link from 'next/link';

export const AppNoPageAccess: React.FC<{
  assetId: string;
}> = React.memo(({ assetId }) => {
  const { openInfoMessage } = useBusterNotifications();

  return (
    <div className="flex h-[85vh] w-full flex-col items-center justify-center space-y-6">
      <BusterLogo className="h-16 w-16" />

      <div className="max-w-[440px] text-center">
        <Title
          as="h2"
          className="text-center">{`It looks like you don’t have access to this file...`}</Title>
      </div>

      <div className="flex space-x-2">
        <Button
          onClick={() => {
            openInfoMessage('Requesting access is not currently supported');
          }}>
          Request access
        </Button>
        <Link
          href={createBusterRoute({
            route: BusterRoutes.ROOT
          })}>
          <Button>Go back</Button>
        </Link>
      </div>
    </div>
  );
});

AppNoPageAccess.displayName = 'AppNoPageAccess';
