import { DataMetadata } from '../metric';

export interface RunSQLResponse {
  data: Record<string, string | number | null>[];
  data_metadata: DataMetadata;
}
