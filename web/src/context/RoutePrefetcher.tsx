import React from 'react';
import { useRouter } from 'next/navigation';
import { createBusterRoute } from '@/routes';
import { BusterAppRoutes } from '@/routes/busterRoutes/busterAppRoutes';
import { useAsyncEffect } from 'ahooks';

const PRIORITY_ROUTES = [
  BusterAppRoutes.APP_ROOT,
  BusterAppRoutes.APP_COLLECTIONS,
  BusterAppRoutes.APP_DASHBOARDS,
  BusterAppRoutes.APP_METRIC,
  BusterAppRoutes.APP_DATASETS,
  BusterAppRoutes.APP_DASHBOARD_METRICS_ID,
  BusterAppRoutes.APP_DASHBOARD_ID,
  BusterAppRoutes.APP_CHAT_ID,
  BusterAppRoutes.APP_CHAT_ID_COLLECTION_ID,
  BusterAppRoutes.APP_CHAT_ID_DASHBOARD_ID,
  BusterAppRoutes.APP_CHAT_ID_METRIC_ID
];

export const RoutePrefetcher: React.FC<{}> = () => {
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
          const path = createBusterRoute({ route: route as BusterAppRoutes.APP_COLLECTIONS });
          router.prefetch(path);
        });

        observer.disconnect();
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  }, [router]);

  return null;
};
