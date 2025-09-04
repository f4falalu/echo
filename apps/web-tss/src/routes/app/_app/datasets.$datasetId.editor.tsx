import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/_app/datasets/$datasetId/editor')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/_app/datasets/$datasetId/editor"!</div>
}
