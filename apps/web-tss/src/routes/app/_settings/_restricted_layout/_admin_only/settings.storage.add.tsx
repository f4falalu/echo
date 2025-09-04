import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/app/_settings/_restricted_layout/_admin_only/settings/storage/add',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      Hello "/app/_settings/_restricted_layout/_admin_only/storage/add"!
    </div>
  )
}
