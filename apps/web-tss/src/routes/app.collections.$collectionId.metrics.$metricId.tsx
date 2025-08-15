import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/app/collections/$collectionId/metrics/$metricId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/collections/$collectionId/metrics/$metricId"!</div>
}
