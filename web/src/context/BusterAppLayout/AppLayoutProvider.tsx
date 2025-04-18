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

      // Check if the target URL is exactly the same as current URL (including search params)
      const targetUrl = new URL(targetPath, window.location.origin);
      const currentUrl = new URL(window.location.href);
      if (targetUrl.toString() === currentUrl.toString()) {
        return Promise.resolve();
      }

      // Extract the pathname without query parameters
      const targetPathname = targetUrl.pathname;
      const currentPathname = currentUrl.pathname;

      if (options?.shallow) {
        const isSamePathname = targetPathname === currentPathname;

        if (isSamePathname) {
          return new Promise((resolve) => {
            const params = getQueryParamsFromPath(targetPath);
            onChangeQueryParams(params, false);
            resolve();
          });
        }
      }

      return new Promise((resolve) => {
        // If we're already on the target pathname, but query params might differ
        if (currentPathname === targetPathname && targetPath.indexOf('?') === -1) {
          // Clear query params by using the pathname only
          window.history.pushState({}, '', targetPathname);
          resolve();
          return;
        }

        // If target and current pathnames are the same but target includes query params
        if (currentPathname === targetPathname && targetPath.indexOf('?') !== -1) {
          // Compare current and target query parameters
          const currentUrl = new URL(window.location.href);
          const targetUrl = new URL(targetPath, window.location.origin);
          const currentParams = Object.fromEntries(currentUrl.searchParams.entries());
          const targetParams = Object.fromEntries(targetUrl.searchParams.entries());

          // Check if the params are actually different
          const paramsAreDifferent = JSON.stringify(currentParams) !== JSON.stringify(targetParams);

          if (!paramsAreDifferent) {
            resolve();
            return;
          }

          push(targetPath);
          // Set up an effect to watch for pathname changes
          const checkPathChange = (waitTime: number = 25, iteration: number = 0) => {
            if (window.location.href.includes(targetPath)) {
              resolve();
            } else if (iteration >= 10) {
              resolve();
            } else {
              const newWaitTime = waitTime * 1.25;
              setTimeout(() => checkPathChange(newWaitTime, iteration + 1), newWaitTime);
            }
          };
          checkPathChange();
          return;
        }

        // Default case - different pathnames
        const checkPathChange = (waitTime: number = 25, iteration: number = 0) => {
          if (window.location.pathname !== currentPathname) {
            resolve();
          } else if (iteration >= 10) {
            resolve();
          } else {
            const newWaitTime = waitTime * 1.25;
            setTimeout(() => checkPathChange(newWaitTime, iteration + 1), newWaitTime);
          }
        };

        push(targetPath);
        checkPathChange();
      });
    }
  );

  const createQueryParams = useMemoizedFn(
    (params: Record<string, string | null>, preserveExisting: boolean) => {
      const url = new URL(window.location.href);

      if (!preserveExisting) {
        // Clear all existing search parameters
        url.search = '';
      }

      // Add new parameters
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          url.searchParams.set(key, value);
        } else {
          url.searchParams.delete(key);
        }
      });

      return url;
    }
  );

  //TODO: make this typesafe...
  const onChangeQueryParams = useMemoizedFn(
    (params: Record<string, string | null>, preserveExisting: boolean) => {
      const isRemovingANonExistentParam = Object.keys(params).every(
        (key) => !window.location.href.includes(key)
      );
      if (isRemovingANonExistentParam) return; //we don't need to do anything if we're removing a non-existent param
      const url = createQueryParams(params, preserveExisting);
      if (url) window.history.pushState({}, '', url); //we used window.history instead of replace for true shallow routing
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
