import { UserDatasetGroupsController } from './UserDatasetGroupsController';

export default function Page({ params }: { params: { userId: string } }) {
  return <UserDatasetGroupsController userId={params.userId} />;
}
