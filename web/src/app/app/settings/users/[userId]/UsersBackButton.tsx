'use client';

import { BackButton } from '@/components';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { createBusterRoute, BusterRoutes } from '@/routes';
import { useMemo } from 'react';

export const UsersBackButton = ({}: {}) => {
  const previousPath = useAppLayoutContextSelector((state) => state.previousPath);
  const previousRoute = useAppLayoutContextSelector((state) => state.previousRoute);

  const {
    route,
    text
  }: {
    route: string;
    text: string;
  } = useMemo(() => {
    // if (previousPath) {
    //   return {
    //     route: previousPath,
    //     text: 'Users'
    //   };
    // }
    return {
      route: createBusterRoute({ route: BusterRoutes.APP_SETTINGS_USERS }),
      text: 'Users'
    };
  }, [previousRoute]);

  return <BackButton text={text} linkUrl={route} />;
};
