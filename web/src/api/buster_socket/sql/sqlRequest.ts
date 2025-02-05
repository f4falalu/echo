import { BusterSocketRequestBase } from '../base_interfaces';

export type SQLRunEmit = BusterSocketRequestBase<
  '/sql/run',
  {
    data_source_id: string;
    sql: string;
  }
>;

export type SQLEmits = SQLRunEmit;
