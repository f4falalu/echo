import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/app/collections/$collectionId/dashboard/$dashboardId/metrics/$metricId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      Hello
      "/app/collections/$collectionId/dashboard/$dashboardId/metrics/$metricId"!
    </div>
  )
}
