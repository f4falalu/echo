import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const searchParamsSchema = z.object({
  metric_version_number: z.coerce.number().optional(),
})

export const Route = createFileRoute('/app/chats/$chatId/metrics/$metricId')({
  validateSearch: searchParamsSchema,
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/chats/$chatId/metrics/$metricId"!</div>
}
