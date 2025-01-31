import { DataMetadata } from '@/api/asset_interfaces';

export interface RunSQLResponse {
  data: Record<string, string | number | null>[];
  data_metadata: DataMetadata;
}
