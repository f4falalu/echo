import { UserTeamsController } from './UserTeamsController';

export default function Page({ params }: { params: { userId: string } }) {
  return <UserTeamsController userId={params.userId} />;
}
