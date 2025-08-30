import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/_app/_asset/metric/$metricId/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/_app/_asset/metric/$metricId/"!</div>
}
