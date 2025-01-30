import type { BusterCollectionAsset } from './chatAssetCollectionInterfaces';
import type { BusterDashboardAsset } from './chatAssetDashboardInterfaces';
import type { BusterDatasetAsset } from './chatAssetDatasetInterfaces';
import type { BusterTermAsset } from './chatAssetTermInterfaces';
import type { BusterValueAsset } from './chatAssetValueInterfaces';
import { BusterMetricAsset } from '@/api/buster_rest/metric';
export * from '../../share/shareInterfaces';

export type BusterChatAsset =
  | BusterMetricAsset
  | BusterDashboardAsset
  | BusterCollectionAsset
  | BusterDatasetAsset
  | BusterTermAsset
  | BusterValueAsset;

export {
  BusterCollectionAsset,
  BusterDashboardAsset,
  BusterDatasetAsset,
  BusterTermAsset,
  BusterValueAsset
};
