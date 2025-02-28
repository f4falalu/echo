import { PermissionUsers } from '@controllers/DatasetPermissionUser';

export default async function Page({ params }: { params: { datasetId: string } }) {
  return <PermissionUsers datasetId={params.datasetId} />;
}
