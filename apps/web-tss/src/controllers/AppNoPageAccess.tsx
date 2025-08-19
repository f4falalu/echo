'use client';

import type { AssetType } from '@buster/server-shared/assets';
import { Link } from '@tanstack/react-router';
import React, { useMemo } from 'react';
import { BusterLogo } from '@/assets/svg/BusterLogo';
import { Button } from '@/components/ui/buttons';
import { Title } from '@/components/ui/typography';
import { useSupabaseContext } from '@/context/Supabase';
import type { OptionsTo } from '@/types/routes';

export const AppNoPageAccess: React.FC<{
  assetId: string;
  type: AssetType;
}> = React.memo(({ type }) => {
  const isAnonymousUser = useSupabaseContext((x) => x.isAnonymousUser);

  const { buttonText, link } = useMemo((): {
    buttonText: string;
    link: OptionsTo;
  } => {
    console.warn('fix pathname');
    const isEmbedPage =
      typeof window !== 'undefined' && window.location.pathname.startsWith('/embed');

    const shouldShowLogin = isAnonymousUser || isEmbedPage;

    if (shouldShowLogin) {
      const currentUrl =
        typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '';

      return {
        buttonText: 'Login to view asset',
        link: {
          to: '/auth/login',
          search: {
            next: currentUrl,
          },
        },
      };
    }

    return {
      buttonText: 'Go home',
      link: {
        to: '/app/home',
      },
    };
  }, [isAnonymousUser]);

  return (
    <div className="flex h-[85vh] w-full flex-col items-center justify-center space-y-6">
      <BusterLogo className="h-16 w-16" />

      <div className="max-w-[550px] text-center">
        <Title as="h2" className="text-center">
          {`It looks like you don't have access to this ${type}...`}
        </Title>
      </div>

      <div className="flex space-x-2">
        <Link {...link} preload="viewport" preloadDelay={650}>
          <Button>{buttonText}</Button>
        </Link>
      </div>
    </div>
  );
});

AppNoPageAccess.displayName = 'AppNoPageAccess';
