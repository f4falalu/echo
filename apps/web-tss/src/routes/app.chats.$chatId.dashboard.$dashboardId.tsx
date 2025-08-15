import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/app/chats/$chatId/dashboard/$dashboardId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/chats/$chatId/dashboard/$dashboardId"!</div>
}
