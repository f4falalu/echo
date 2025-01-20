import { UserDatasetsController } from './UserDatasetsController';

export default function Page({ params }: { params: { userId: string } }) {
  return <UserDatasetsController userId={params.userId} />;
}
