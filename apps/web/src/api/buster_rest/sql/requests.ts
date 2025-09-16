import type { RunSQLResponse } from '../../asset_interfaces/sql';
import { mainApiV2 } from '../instances';

export const runSQL = async (params: { data_source_id: string; sql: string }) => {
  return mainApiV2.post<RunSQLResponse>('/sql/run', params).then((res) => res.data);
};
