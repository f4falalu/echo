import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/home')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="bg-red-500 p-10 border border-purple-500 border-4">Hello "/app/home"!</div>
  );
}
