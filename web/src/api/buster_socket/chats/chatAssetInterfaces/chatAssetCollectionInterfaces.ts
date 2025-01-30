import { BusterShare } from '../../share/shareInterfaces';

export type BusterCollectionAsset = {
  id: string;
  type: 'collection';
} & BusterShare;
