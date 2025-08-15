import { createFileRoute } from '@tanstack/react-router'

// Search params interface for type safety
interface RouteSearch {
  dashboard_version_number?: number
}

export const Route = createFileRoute(
  '/app/collections/$collectionId/chats/$chatId/dashboards/$dashboardId',
)({
  validateSearch: (search: Record<string, unknown>): RouteSearch => ({
    dashboard_version_number: search.dashboard_version_number
      ? Number(search.dashboard_version_number)
      : undefined,
  }),
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      Hello
      "/app/collections/$collectionId/chats/$chatId/dashboards/$dashboardId"!
    </div>
  )
}
