import { CollectionIndividualController } from '@controllers/CollectionIndividualController';

export default function CollectionIdPage({ params }: { params: { collectionId: string } }) {
  const { collectionId } = params;

  return <CollectionIndividualController collectionId={collectionId} />;
}
