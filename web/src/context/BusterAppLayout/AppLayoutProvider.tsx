'use client';

import { BusterRoutesWithArgsRoute, createBusterRoute } from '@/routes/busterRoutes';
import { pathNameToParentRoute, pathNameToRoute } from '@/routes/helpers';
import { useMemoizedFn } from '@/hooks';
import { useRouter, usePathname, useParams } from 'next/navigation';
import React, { PropsWithChildren } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';

export const useAppLayout = () => {
  const { push } = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentRoute = pathNameToRoute(pathname, params);
  const currentParentRoute = pathNameToParentRoute(pathname, params);

  const onChangePage = useMemoizedFn(
    (params: BusterRoutesWithArgsRoute | string): Promise<void> => {
      return new Promise((resolve) => {
        const targetPath = typeof params === 'string' ? params : createBusterRoute(params);
        const currentPath = window.location.pathname;

        // If we're already on the target path, resolve immediately
        if (currentPath === targetPath) {
          resolve();
          return;
        }

        // Set up an effect to watch for pathname changes
        const checkPathChange = (waitTime: number = 25, iteration: number = 0) => {
          if (window.location.pathname !== currentPath) {
            resolve();
          } else if (iteration >= 10) {
            // Resolve after 10 attempts to prevent infinite loops
            resolve();
          } else {
            // Check again in a short while if the path hasn't changed yet
            const newWaitTime = waitTime * 1.25;
            setTimeout(() => checkPathChange(newWaitTime, iteration + 1), newWaitTime);
          }
        };

        // Start the navigation
        push(targetPath);

        // Start checking for path changes
        checkPathChange();
      });
    }
  );

  const onChangeQueryParams = useMemoizedFn((params: Record<string, string>) => {
    const searchParams = window.location.search;
    const newSearchParams = new URLSearchParams(searchParams);
    Object.entries(params).forEach(([key, value]) => {
      newSearchParams.set(key, value);
    });
    const newPath = `${pathname}?${newSearchParams.toString()}`;
    push(newPath);
  });

  return {
    currentRoute,
    onChangePage,
    currentParentRoute,
    onChangeQueryParams
  };
};

const AppLayoutContext = createContext<ReturnType<typeof useAppLayout>>(
  {} as ReturnType<typeof useAppLayout>
);

export const AppLayoutProvider = React.memo<PropsWithChildren>(({ children }) => {
  const value = useAppLayout();

  return <AppLayoutContext.Provider value={value}>{children}</AppLayoutContext.Provider>;
});
AppLayoutProvider.displayName = 'AppLayoutProvider';

export const useAppLayoutContextSelector = <T,>(
  selector: (state: ReturnType<typeof useAppLayout>) => T
) => useContextSelector(AppLayoutContext, selector);
