import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';
import { Route as MetricRoute } from './metrics.$metricId';

export const Route = createFileRoute('/app/_app/_asset/dashboards/$dashboardId/metrics/$metricId')({
  staticData: {
    assetType: 'metric',
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/_app/dashboards/$dashboardId/metrics/$metricId"!</div>;
}
