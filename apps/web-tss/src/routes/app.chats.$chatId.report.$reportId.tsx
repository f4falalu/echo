import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/chats/$chatId/report/$reportId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/chats/$chatId/report/$reportId"!</div>
}
