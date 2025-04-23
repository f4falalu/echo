'use client';

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { BusterAppRoutes } from '@/routes/busterRoutes/busterAppRoutes';
import { useAsyncEffect } from '@/hooks';
import { timeout } from '@/lib';

const HIGH_PRIORITY_ROUTES = [
  BusterRoutes.APP_HOME,
  BusterRoutes.APP_CHAT_ID,
  BusterRoutes.APP_METRIC_ID_CHART,
  BusterRoutes.APP_DASHBOARD_ID
];

const LOW_PRIORITY_ROUTES = [
  BusterRoutes.APP_LOGS,
  BusterRoutes.APP_CHAT,
  BusterRoutes.APP_METRIC,
  BusterRoutes.APP_COLLECTIONS,
  BusterRoutes.APP_DASHBOARDS,
  BusterRoutes.APP_DATASETS,
  BusterRoutes.SETTINGS,
  BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART
];

export const RoutePrefetcher: React.FC<{}> = React.memo(() => {
  const router = useRouter();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPreFetchedHighPriorityRef = useRef(false);
  const isPreFetchedLowPriorityRef = useRef(false);

  useAsyncEffect(async () => {
    const prefetchRoutes = (routes: BusterRoutes[], priority: 'high' | 'low') => {
      if (priority === 'high' && isPreFetchedHighPriorityRef.current) return;
      if (priority === 'low' && isPreFetchedLowPriorityRef.current) return;

      routes.forEach((route) => {
        const path = createBusterRoute({ route: route as BusterAppRoutes.APP_COLLECTIONS });
        router.prefetch(path);
      });

      if (priority === 'high') {
        isPreFetchedHighPriorityRef.current = true;
      } else {
        isPreFetchedLowPriorityRef.current = true;
      }
    };

    if (!isPreFetchedHighPriorityRef.current) {
      prefetchRoutes(HIGH_PRIORITY_ROUTES, 'high');
    }

    // Wait for page load
    if (document.readyState !== 'complete') {
      await Promise.race([
        new Promise((resolve) => {
          window.addEventListener('load', resolve, { once: true });
        }),
        timeout(2000)
      ]);
    }

    // Setup network activity monitoring
    let fallbackTimer: NodeJS.Timeout;
    const observer = new PerformanceObserver((list) => {
      // Clear any existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set a new debounce timer - will trigger if no network activity for 1500ms
      debounceTimerRef.current = setTimeout(() => {
        prefetchRoutes(LOW_PRIORITY_ROUTES, 'low');
        observer.disconnect();
      }, 1000);
    });

    try {
      observer.observe({ entryTypes: ['resource'] });

      // Fallback - ensure prefetch happens even if network is already quiet
      fallbackTimer = setTimeout(() => {
        prefetchRoutes(LOW_PRIORITY_ROUTES, 'low');
        observer.disconnect();
      }, 3000);
    } catch (error) {
      console.error('Failed to setup PerformanceObserver:', error);
      observer.disconnect();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      // Still prefetch low priority routes as fallback
      prefetchRoutes(LOW_PRIORITY_ROUTES, 'low');
    }

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (fallbackTimer) clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, [router]);

  return null;
});

RoutePrefetcher.displayName = 'RoutePrefetcher';
