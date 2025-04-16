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
    (
      params: BusterRoutesWithArgsRoute | string,
      options?: { shallow?: boolean }
    ): Promise<void> => {
      const targetPath = typeof params === 'string' ? params : createBusterRoute(params);

      if (options?.shallow) {
        const isSameMinusQueryParams =
          new URL(targetPath, window.location.origin).pathname ===
          new URL(window.location.href).pathname;

        if (isSameMinusQueryParams) {
          return new Promise((resolve) => {
            const params = getQueryParamsFromPath(targetPath);
            onChangeQueryParams(params, false);
            resolve();
          });
        }
      }

      return new Promise((resolve) => {
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
        console.log('pushed', targetPath);

        // Start checking for path changes
        checkPathChange();
      });
    }
  );

  const createQueryParams = useMemoizedFn(
    (params: Record<string, string | null>, preserveExisting: boolean) => {
      const url = new URL(window.location.href);
      const searchParams = url.searchParams;

      if (!preserveExisting) {
        searchParams.forEach((value, key) => {
          searchParams.delete(key);
        });
      }

      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          searchParams.set(key, value);
        } else {
          searchParams.delete(key);
        }
      });

      url.search = searchParams.toString();
      return url;
    }
  );

  //TODO: make this typesafe...
  const onChangeQueryParams = useMemoizedFn(
    (params: Record<string, string | null>, preserveExisting: boolean) => {
      const url = createQueryParams(params, preserveExisting);
      window.history.pushState({}, '', url); //we used window.history instead of replace for true shallow routing
    }
  );

  return {
    currentRoute,
    onChangePage,
    currentParentRoute,
    onChangeQueryParams,
    createQueryParams
  };
};

const getQueryParamsFromPath = (path: string): Record<string, string> => {
  const url = new URL(path, window.location.origin);
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
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
