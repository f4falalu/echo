import { createFileRoute } from '@tanstack/react-router'

// Search params interface for type safety
interface RouteSearch {
  report_version_number?: number
  metric_version_number?: number
}

export const Route = createFileRoute(
  '/app/chats/$chatId/report/$reportId/metrics/$metricId',
)({
  validateSearch: (search: Record<string, unknown>): RouteSearch => ({
    report_version_number: search.report_version_number
      ? Number(search.report_version_number)
      : undefined,
    metric_version_number: search.metric_version_number
      ? Number(search.metric_version_number)
      : undefined,
  }),
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>Hello "/app/chats/$chatId/report/$reportId/metrics/$metricId"!</div>
  )
}
