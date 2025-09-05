import { createFileRoute } from '@tanstack/react-router';
import { UserOverviewController } from '@/controllers/UserIndividualControllers/UserOverviewController';

export const Route = createFileRoute('/app/_settings/_permissions/settings/users/$userId/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { userId } = Route.useParams();
  return <UserOverviewController userId={userId} />;
}
