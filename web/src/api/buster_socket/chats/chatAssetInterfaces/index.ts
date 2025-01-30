import type { BusterCollectionAsset } from './chatAssetCollectionInterfaces';
import type { BusterDashboardAsset } from './chatAssetDashboardInterfaces';
import type { BusterDatasetAsset } from './chatAssetDatasetInterfaces';
import type { BusterMetricAsset } from './chatAssetMetricInterfaces';
import type { BusterTermAsset } from './chatAssetTermInterfaces';
import type { BusterValueAsset } from './chatAssetValueInterfaces';

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
  BusterMetricAsset,
  BusterTermAsset,
  BusterValueAsset
};
