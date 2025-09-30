import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/_app/home/shortcuts')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/_app/home/shortcuts"!</div>
}
