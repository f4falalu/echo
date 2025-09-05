import type { DataMetadata, DataResult } from '@buster/server-shared/metrics';
export interface RunSQLResponse {
  data: DataResult;
  data_metadata: DataMetadata;
}
