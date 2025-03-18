'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { createBusterRoute } from '@/routes';
import { type BusterRoutes, BusterRoutes as BusterRouteEnum } from '@/routes/busterRoutes';
import { useAsyncEffect } from '@/hooks';

const PRIORITY_ROUTES: Array<BusterRoutes> = [
  BusterRouteEnum.APP_HOME,
  BusterRouteEnum.APP_COLLECTIONS,
  BusterRouteEnum.APP_DASHBOARDS,
  BusterRouteEnum.APP_METRIC,
  BusterRouteEnum.APP_DATASETS,
  BusterRouteEnum.APP_DASHBOARD_METRICS_ID,
  BusterRouteEnum.APP_DASHBOARD_ID,
  BusterRouteEnum.APP_CHAT_ID,
  BusterRouteEnum.APP_CHAT_ID_COLLECTION_ID,
  BusterRouteEnum.APP_CHAT_ID_DASHBOARD_ID,
  BusterRouteEnum.APP_CHAT_ID_METRIC_ID
];

export const RoutePrefetcher: React.FC = React.memo(() => {
  const router = useRouter();

  useAsyncEffect(async () => {
    // Wait for page load
    if (document.readyState !== 'complete') {
      await new Promise((resolve) => {
        window.addEventListener('load', resolve, { once: true });
      });
    }

    let isPreFetched = false;
    const observer = new PerformanceObserver((list) => {
      // Get only the recent non-image entries
      const recentEntries = list.getEntries().filter((entry) => {
        const timeSinceEntry = performance.now() - entry.startTime;
        const isRecent = timeSinceEntry < 1000;
        const isNotImage = (entry as PerformanceResourceTiming).initiatorType !== 'img';
        return isRecent && isNotImage;
      });

      if (recentEntries.length === 0 && !isPreFetched) {
        isPreFetched = true;
        PRIORITY_ROUTES.forEach((route) => {
          // For routes that don't require additional parameters
          if (
            route === BusterRouteEnum.APP_HOME ||
            route === BusterRouteEnum.APP_COLLECTIONS ||
            route === BusterRouteEnum.APP_DASHBOARDS ||
            route === BusterRouteEnum.APP_METRIC ||
            route === BusterRouteEnum.APP_DATASETS
          ) {
            const path = createBusterRoute({ route });
            router.prefetch(path);
          }
          // Skip routes that require parameters for now
        });

        observer.disconnect();
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  }, [router]);

  return null;
});

RoutePrefetcher.displayName = 'RoutePrefetcher';
