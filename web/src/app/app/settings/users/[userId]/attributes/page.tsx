import { UserAttributesController } from './UserAttributesController';

export default function Page({ params }: { params: { userId: string } }) {
  return <UserAttributesController userId={params.userId} />;
}
