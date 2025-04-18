'use client';

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { BusterAppRoutes } from '@/routes/busterRoutes/busterAppRoutes';
import { useAsyncEffect } from '@/hooks';
import { timeout } from '@/lib';

const PRIORITY_ROUTES = [
  BusterRoutes.APP_HOME,
  BusterRoutes.APP_CHAT,
  BusterRoutes.APP_CHAT_ID,
  BusterRoutes.APP_METRIC_ID_CHART
];

const LOW_PRIORITY_ROUTES = [
  BusterRoutes.APP_LOGS,
  BusterRoutes.APP_DATASETS,
  BusterRoutes.SETTINGS,
  BusterRoutes.APP_DASHBOARD_ID,
  BusterRoutes.APP_METRIC_ID_CHART,
  BusterRoutes.APP_COLLECTIONS,
  BusterRoutes.APP_DASHBOARDS,
  BusterRoutes.APP_CHAT,
  BusterRoutes.APP_CHAT_ID,
  BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART
];

export const RoutePrefetcher: React.FC<{}> = React.memo(() => {
  const router = useRouter();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPreFetchedRef = useRef(false);

  useAsyncEffect(async () => {
    const prefetchRoutes = (routes: BusterRoutes[]) => {
      if (isPreFetchedRef.current) return;

      isPreFetchedRef.current = true;

      routes.forEach((route) => {
        const path = createBusterRoute({ route: route as BusterAppRoutes.APP_COLLECTIONS });
        router.prefetch(path);
      });
    };

    prefetchRoutes(PRIORITY_ROUTES);

    // Wait for page load
    if (document.readyState !== 'complete') {
      await Promise.race([
        new Promise((resolve) => {
          window.addEventListener('load', resolve, { once: true });
        }),
        timeout(5000)
      ]);
    }

    // Setup network activity monitoring
    const observer = new PerformanceObserver((list) => {
      // Clear any existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set a new debounce timer - will trigger if no network activity for 1500ms
      debounceTimerRef.current = setTimeout(() => {
        prefetchRoutes(LOW_PRIORITY_ROUTES);
        observer.disconnect();
      }, 1500);
    });

    observer.observe({ entryTypes: ['resource'] });

    // Fallback - ensure prefetch happens even if network is already quiet
    const fallbackTimer = setTimeout(() => {
      prefetchRoutes(LOW_PRIORITY_ROUTES);
      observer.disconnect();
    }, 6000);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, [router]);

  return null;
});

RoutePrefetcher.displayName = 'RoutePrefetcher';
