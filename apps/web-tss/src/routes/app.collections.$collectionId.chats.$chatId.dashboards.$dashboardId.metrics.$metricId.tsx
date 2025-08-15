import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/app/collections/$collectionId/chats/$chatId/dashboards/$dashboardId/metrics/$metricId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      Hello
      "/app/collections/$collectionId/chats/$chatId/dashboards/$dashboardId/metrics/$metricId"!
    </div>
  )
}
