import { createFileRoute } from '@tanstack/react-router'

// Search params interface for type safety
interface RouteSearch {
  metric_version_number?: number
}

export const Route = createFileRoute(
  '/app/collections/$collectionId/chats/$chatId/metrics/$metricId',
)({
  validateSearch: (search: Record<string, unknown>): RouteSearch => ({
    metric_version_number: search.metric_version_number
      ? Number(search.metric_version_number)
      : undefined,
  }),
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      Hello "/app/collections/$collectionId/chats/$chatId/metrics/$metricId"!
    </div>
  )
}
