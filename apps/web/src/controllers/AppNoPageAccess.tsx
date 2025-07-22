'use client';

import Link from 'next/link';
import React, { useMemo } from 'react';
import { BusterLogo } from '@/assets/svg/BusterLogo';
import { Button } from '@/components/ui/buttons';
import { Title } from '@/components/ui/typography';
import { useSupabaseContext } from '@/context/Supabase';
import { BusterRoutes, createBusterRoute } from '@/routes';

export const AppNoPageAccess: React.FC<{
  assetId: string;
}> = React.memo(({ assetId }) => {
  const isAnonymousUser = useSupabaseContext((x) => x.isAnonymousUser);
  
  const { buttonText, linkUrl } = useMemo(() => {
    const isEmbedPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/embed');
    
    const shouldShowLogin = isAnonymousUser || isEmbedPage;
    
    if (shouldShowLogin) {
      const currentUrl = typeof window !== 'undefined' 
        ? `${window.location.pathname}${window.location.search}`
        : '';
        
      return {
        buttonText: 'Login',
        linkUrl: createBusterRoute({
          route: BusterRoutes.AUTH_LOGIN,
          next: encodeURIComponent(currentUrl)
        })
      };
    }
    
    return {
      buttonText: 'Go home',
      linkUrl: createBusterRoute({
        route: BusterRoutes.APP_HOME
      })
    };
  }, [isAnonymousUser]);

  return (
    <div className="flex h-[85vh] w-full flex-col items-center justify-center space-y-6">
      <BusterLogo className="h-16 w-16" />

      <div className="max-w-[440px] text-center">
        <Title as="h2" className="text-center">
          {"It looks like you don't have access to this file..."}
        </Title>
      </div>

      <div className="flex space-x-2">
        <Link href={linkUrl}>
          <Button>{buttonText}</Button>
        </Link>
      </div>
    </div>
  );
});

AppNoPageAccess.displayName = 'AppNoPageAccess';
