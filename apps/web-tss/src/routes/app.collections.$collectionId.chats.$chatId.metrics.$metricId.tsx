import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/app/collections/$collectionId/chats/$chatId/metrics/$metricId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      Hello "/app/collections/$collectionId/chats/$chatId/metrics/$metricId"!
    </div>
  )
}
